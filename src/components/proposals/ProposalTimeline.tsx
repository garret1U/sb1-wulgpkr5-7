import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getProposalMonthlyCosts } from '../../lib/api';
import type { Location } from '../../types';

interface ProposalTimelineProps {
  proposalId: string;
  locations: Location[];
}

interface MonthData {
  month: string;
  totalCost: number;
  mpls: number;
  dia: number;
  broadband: number;
  lte: number;
}

function formatMonthYear(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short',
    year: 'numeric'
  });
}

export function ProposalTimeline({ proposalId }: ProposalTimelineProps) {
  // Fetch monthly costs from the database
  const { data: monthlyCosts, isLoading } = useQuery({
    queryKey: ['proposal-monthly-costs', proposalId],
    queryFn: () => getProposalMonthlyCosts(proposalId)
  });

  // Transform the data for the chart
  const chartData = useMemo(() => {
    if (!monthlyCosts) return [];

    // Group costs by month
    const monthlyData = new Map<string, MonthData>();

    monthlyCosts.forEach(record => {
      const monthKey = record.month_year;
      const monthData = monthlyData.get(monthKey) || {
        month: formatMonthYear(monthKey),
        totalCost: 0,
        mpls: 0,
        dia: 0,
        broadband: 0,
        lte: 0
      };

      // Add cost to appropriate category
      const type = record.circuit?.type?.toLowerCase() || '';
      if (type.includes('mpls')) {
        monthData.mpls += record.monthly_cost;
      } else if (type.includes('dia')) {
        monthData.dia += record.monthly_cost;
      } else if (type.includes('broadband')) {
        monthData.broadband += record.monthly_cost;
      } else if (type.includes('lte')) {
        monthData.lte += record.monthly_cost;
      }

      monthData.totalCost += record.monthly_cost;
      monthlyData.set(monthKey, monthData);
    });

    return Array.from(monthlyData.values());
  }, [monthlyCosts]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Monthly Circuit Costs
      </h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tick={{ fill: '#6B7280' }}
              axisLine={{ stroke: '#374151' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '0.375rem'
              }}
              labelStyle={{ color: '#9CA3AF' }}
              itemStyle={{ color: '#E5E7EB' }}
            />
            <Legend 
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar dataKey="mpls" name="MPLS" stackId="a" fill="#7E22CE" />
            <Bar dataKey="dia" name="DIA" stackId="a" fill="#9333EA" />
            <Bar dataKey="broadband" name="Broadband" stackId="a" fill="#A855F7" />
            <Bar dataKey="lte" name="LTE" stackId="a" fill="#C084FC" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}