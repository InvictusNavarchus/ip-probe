import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge, RiskBadge } from './ui/Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { useSecurityAssessment } from '../hooks/useIPAnalysis';

interface SecurityChartProps {
  ipAddress?: string;
  className?: string;
}

export function SecurityChart({ ipAddress, className }: SecurityChartProps) {
  const { data: assessment, isLoading, error } = useSecurityAssessment(ipAddress || '', !!ipAddress);

  if (!ipAddress) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto mb-2 text-slate-400" />
            <p className="font-medium text-slate-600 dark:text-slate-400">No IP Selected</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Select an IP address to view security assessment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">
              Analyzing security...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-600 dark:text-red-400">Assessment Failed</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {error.message || 'Unable to perform security assessment'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return null;
  }

  // Prepare data for charts
  const riskData = [
    { name: 'Network', score: assessment.categories.network.score, color: '#3b82f6' },
    { name: 'DNS', score: assessment.categories.dns.score, color: '#10b981' },
    { name: 'Reputation', score: assessment.categories.reputation.score, color: '#f59e0b' },
    { name: 'Privacy', score: assessment.categories.privacy.score, color: '#8b5cf6' },
  ];

  const issuesData = [
    { name: 'Critical', count: assessment.summary.criticalIssues, color: '#ef4444' },
    { name: 'High', count: assessment.summary.highIssues, color: '#f97316' },
    { name: 'Medium', count: assessment.summary.mediumIssues, color: '#eab308' },
    { name: 'Low', count: assessment.summary.lowIssues, color: '#22c55e' },
  ].filter(item => item.count > 0);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Assessment
          </CardTitle>
          <RiskBadge riskScore={assessment.overallRiskScore} />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Overall Risk Score */}
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {assessment.overallRiskScore}/100
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Overall Risk Score
            </p>
          </div>

          {/* Category Scores Chart */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Category Scores
            </h3>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgb(30 41 59)',
                      border: '1px solid rgb(71 85 105)',
                      borderRadius: '6px',
                      color: 'rgb(226 232 240)'
                    }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Issues Distribution */}
          {issuesData.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Issues Distribution
              </h3>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issuesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {issuesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgb(30 41 59)',
                        border: '1px solid rgb(71 85 105)',
                        borderRadius: '6px',
                        color: 'rgb(226 232 240)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {issuesData.map((item) => (
                  <Badge key={item.name} variant="secondary" className="text-xs">
                    <span 
                      className="w-2 h-2 rounded-full mr-1.5" 
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}: {item.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Category Details */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Category Details
            </h3>
            
            <div className="space-y-3">
              {Object.entries(assessment.categories).map(([category, data]) => (
                <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                      {category}
                    </span>
                    <Badge variant={data.score >= 80 ? 'success' : data.score >= 60 ? 'warning' : 'danger'}>
                      {data.score}/100
                    </Badge>
                  </div>
                  
                  {data.issues.length > 0 && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p className="font-medium mb-1">Issues:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {data.issues.slice(0, 3).map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                        {data.issues.length > 3 && (
                          <li className="text-slate-500">
                            +{data.issues.length - 3} more issues
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
