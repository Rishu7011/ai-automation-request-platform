// Task 12.3 — Analytics Data Layer & MongoDB Aggregation Pipelines
// Computes enterprise automation metrics with confidence-based exclusion logic (Task 9.3)
// and high-performance MongoDB aggregation pipelines.

import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { RequestEstimate } from '@/models/RequestEstimate';

export interface AnalyticsSummary {
  overview: {
    totalRequests: number;
    submittedCount: number;
    approvedCount: number;
    rejectedCount: number;
    completedCount: number;
    approvalRate: number; // percentage
    totalAnnualDollarsSaved: number; // excluding LOW confidence unreviewed
    totalAnnualHoursSaved: number; // excluding LOW confidence unreviewed
    excludedLowConfidenceCount: number;
  };
  departmentBreakdown: Array<{
    department: string;
    count: number;
    approvedCount: number;
    totalDollarsSaved: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
  assigneeWorkload: Array<{
    assigneeName: string;
    activeCount: number;
  }>;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  await connectToDatabase();

  // 1. Basic counts pipeline
  const [totalRequests, statusCounts, estimatesAgg, deptAgg] = await Promise.all([
    Request.countDocuments({ deletedAt: null }),

    // Status breakdown
    Request.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Estimates rollup: Exclude LOW confidence unreviewed requests for dollar totals (Task 9.3)
    RequestEstimate.aggregate([
      {
        $facet: {
          allTotals: [
            {
              $group: {
                _id: null,
                totalDollars: { $sum: '$annualDollarsSaved' },
                totalHours: { $sum: '$annualHoursSaved' },
              },
            },
          ],
          filteredTotals: [
            // Match estimates where confidence is not LOW OR estimate was explicitly overridden by an admin
            {
              $match: {
                $or: [
                  { roiConfidence: { $ne: 'LOW' } },
                  { isOverridden: true },
                ],
              },
            },
            {
              $group: {
                _id: null,
                totalDollars: { $sum: '$annualDollarsSaved' },
                totalHours: { $sum: '$annualHoursSaved' },
                count: { $sum: 1 },
              },
            },
          ],
          lowConfidenceCount: [
            {
              $match: {
                roiConfidence: 'LOW',
                isOverridden: false,
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]),

    // Department breakdown
    Request.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['approved', 'planned', 'in_development', 'testing', 'completed']] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Format status distribution
  const statusMap = new Map(statusCounts.map((s) => [s._id, s.count]));
  const approvedCount = (statusMap.get('approved') || 0) + (statusMap.get('completed') || 0) + (statusMap.get('in_development') || 0) + (statusMap.get('planned') || 0);
  const rejectedCount = statusMap.get('rejected') || 0;
  const submittedCount = statusMap.get('submitted') || 0;
  const completedCount = statusMap.get('completed') || 0;

  const decidedCount = approvedCount + rejectedCount;
  const approvalRate = decidedCount > 0 ? Math.round((approvedCount / decidedCount) * 100) : 0;

  const filteredEst = estimatesAgg[0]?.filteredTotals[0] || { totalDollars: 0, totalHours: 0 };
  const lowConfEstCount = estimatesAgg[0]?.lowConfidenceCount[0]?.count || 0;

  const departmentBreakdown = deptAgg.map((d) => ({
    department: d._id as string,
    count: d.count as number,
    approvedCount: d.approvedCount as number,
    totalDollarsSaved: 0, // Placeholder
  }));

  const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
    status: status as string,
    count: count as number,
  }));

  return {
    overview: {
      totalRequests,
      submittedCount,
      approvedCount,
      rejectedCount,
      completedCount,
      approvalRate,
      totalAnnualDollarsSaved: filteredEst.totalDollars || 0,
      totalAnnualHoursSaved: filteredEst.totalHours || 0,
      excludedLowConfidenceCount: lowConfEstCount,
    },
    departmentBreakdown,
    statusDistribution,
    assigneeWorkload: [],
  };
}
