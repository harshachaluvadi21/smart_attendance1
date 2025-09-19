import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dailyData = [
  { name: 'Mon', attendance: 85 },
  { name: 'Tue', attendance: 92 },
  { name: 'Wed', attendance: 78 },
  { name: 'Thu', attendance: 89 },
  { name: 'Fri', attendance: 94 },
  { name: 'Sat', attendance: 76 },
  { name: 'Sun', attendance: 82 },
];

const monthlyData = [
  { name: 'Jan', present: 820, absent: 180 },
  { name: 'Feb', present: 876, absent: 124 },
  { name: 'Mar', present: 901, absent: 99 },
  { name: 'Apr', present: 845, absent: 155 },
];

const subjectData = [
  { name: 'Mathematics', value: 92, color: 'hsl(var(--primary))' },
  { name: 'Physics', value: 88, color: 'hsl(var(--accent))' },
  { name: 'Chemistry', value: 85, color: 'hsl(var(--secondary))' },
  { name: 'Computer Science', value: 95, color: 'hsl(var(--muted))' },
];

export function AttendanceChart() {
  return (
    <div className="space-y-6">
      {/* Daily Attendance Trend */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Weekly Attendance Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="attendance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Comparison */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="present" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="absent" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject-wise Distribution */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Subject-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}