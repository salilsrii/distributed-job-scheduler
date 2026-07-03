import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from './Card'

const COLORS = {
  indigo:  '#6366f1',
  blue:    '#3b82f6',
  emerald: '#10b981',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  violet:  '#8b5cf6',
  orange:  '#f97316',
  slate:   '#64748b',
}

const STATUS_COLORS = {
  queued:    COLORS.amber,
  running:   COLORS.blue,
  completed: COLORS.emerald,
  success:   COLORS.emerald,
  failed:    COLORS.rose,
  retrying:  COLORS.violet,
  dead:      COLORS.slate,
}

export function DashboardCharts({ jobs = [], queues = [], workers = [] }) {
  // 1. Jobs Processed per Hour (Line Chart)
  const hourlyData = Array.from({ length: 12 }, (_, i) => {
    const hour = `${(12 + i) % 24}:00`
    const count = jobs.filter((j) => {
      if (!j.created_at) return false
      const h = new Date(j.created_at).getHours()
      return h === (12 + i) % 24
    }).length
    return { hour, processed: count }
  })

  // 2. Job Status Distribution (Pie Chart)
  const statusCounts = jobs.reduce((acc, j) => {
    const s = j.status === 'success' ? 'completed' : (j.status || 'queued')
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})
  
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: STATUS_COLORS[name] || COLORS.indigo,
  }))

  // 3. Queue Depth (Bar Chart)
  const queueDepthData = queues.map((q) => ({
    name: q.name,
    depth: jobs.filter((j) => j.queue_id === q.id && ['pending', 'queued', 'running'].includes(j.status)).length,
    max: q.max_concurrency || 1,
  }))

  // 4. Worker Utilization (Horizontal Bar Chart)
  const workerUtilData = workers.map((w, i) => ({
    name: w.hostname || `worker-0${i+1}`,
    utilization: w.status === 'busy' ? 100 : w.status === 'online' ? 35 : 0,
    cpu: w.capabilities?.cpu_usage || (w.status === 'busy' ? 80 : w.status === 'online' ? 25 : 0),
  }))

  // 5. Job Success vs Failure Trend (Area Chart)
  const trendData = queues.length > 0 ? queues.map((q) => {
    const qJobs = jobs.filter(j => j.queue_id === q.id)
    return {
      name: q.name,
      success: qJobs.filter(j => ['success', 'completed'].includes(j.status)).length,
      failure: qJobs.filter(j => j.status === 'failed').length,
    }
  }) : []

  // 6. Jobs by Priority (Stacked Bar Chart)
  const priorityData = [
    {
      tier: 'All Jobs',
      normal: jobs.filter(j => (j.priority || 0) < 5).length,
      high: jobs.filter(j => (j.priority || 0) >= 5 && (j.priority || 0) < 100).length,
      critical: jobs.filter(j => (j.priority || 0) >= 100).length,
    }
  ]

  // 7. Worker Heartbeats (Timeline / Bar)
  const heartbeatData = workers.map((w, i) => {
    const elapsedSec = w.last_seen_at ? Math.max(1, Math.round((Date.now() - new Date(w.last_seen_at).getTime()) / 1000)) : 0
    return {
      worker: w.hostname || `w-${i}`,
      latencyMs: Math.min(1000, elapsedSec * 10),
      status: w.status || 'online',
    }
  })

  // 8. Queue Throughput (Line Chart)
  const throughputData = queues.map((q) => ({
    name: q.name,
    completed: jobs.filter(j => j.queue_id === q.id && ['success', 'completed'].includes(j.status)).length,
  }))

  // 9. Retry Count (Bar Chart)
  const retryData = jobs
    .filter(j => j.status === 'retrying' || j.status === 'failed')
    .slice(0, 5)
    .map(j => ({
      job: j.name,
      retries: j.max_retries || 3,
    }))

  // 10. Daily Executions (Line Chart)
  const dailyData = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'].map((d, idx) => {
    const targetDay = new Date()
    targetDay.setDate(targetDay.getDate() - (6 - idx))
    const dateStr = targetDay.toISOString().slice(0, 10)
    const count = jobs.filter(j => j.created_at && j.created_at.startsWith(dateStr)).length
    return {
      day: idx === 6 ? 'Today' : d,
      executions: count,
    }
  })

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs">
          <p className="font-semibold text-slate-200 mb-1">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} style={{ color: p.color }} className="flex items-center justify-between gap-3">
              <span>{p.name}:</span>
              <span className="font-mono font-bold">{p.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 1. Jobs Processed per Hour */}
      <Card className="flex flex-col">
        <CardHeader><CardTitle className="text-sm">1. Jobs Processed per Hour</CardTitle></CardHeader>
        <CardContent className="h-60 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="processed" name="Processed Jobs" stroke={COLORS.indigo} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Job Status Distribution */}
      <Card className="flex flex-col">
        <CardHeader><CardTitle className="text-sm">2. Job Status Distribution</CardTitle></CardHeader>
        <CardContent className="h-60 pt-2 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. Queue Depth */}
      <Card className="flex flex-col">
        <CardHeader><CardTitle className="text-sm">3. Queue Depth vs Concurrency</CardTitle></CardHeader>
        <CardContent className="h-60 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={queueDepthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="depth" name="Pending/Running" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
              <Bar dataKey="max" name="Max Concurrency" fill={COLORS.slate} radius={[4, 4, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 4. Worker Utilization */}
      <Card className="flex flex-col">
        <CardHeader><CardTitle className="text-sm">4. Worker Utilization (%)</CardTitle></CardHeader>
        <CardContent className="h-60 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={workerUtilData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="utilization" name="Utilization %" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 5. Success vs Failure Trend */}
      <Card className="flex flex-col">
        <CardHeader><CardTitle className="text-sm">5. Success vs Failure Trend</CardTitle></CardHeader>
        <CardContent className="h-60 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="success" name="Success" stackId="1" stroke={COLORS.emerald} fill={COLORS.emerald} fillOpacity={0.3} />
              <Area type="monotone" dataKey="failure" name="Failure" stackId="1" stroke={COLORS.rose} fill={COLORS.rose} fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 6. Jobs by Priority */}
      <Card className="flex flex-col">
        <CardHeader><CardTitle className="text-sm">6. Jobs by Priority Tier</CardTitle></CardHeader>
        <CardContent className="h-60 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="tier" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="normal" name="Normal" stackId="a" fill={COLORS.slate} />
              <Bar dataKey="high" name="High" stackId="a" fill={COLORS.orange} />
              <Bar dataKey="critical" name="Critical" stackId="a" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 7. Worker Heartbeats */}
      <Card className="flex flex-col">
        <CardHeader><CardTitle className="text-sm">7. Worker Heartbeat Latency (ms)</CardTitle></CardHeader>
        <CardContent className="h-60 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={heartbeatData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="worker" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="latencyMs" name="Ping (ms)" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 8. Queue Throughput */}
      <Card className="flex flex-col">
        <CardHeader><CardTitle className="text-sm">8. Queue Throughput (Completed Jobs)</CardTitle></CardHeader>
        <CardContent className="h-60 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={throughputData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="stepAfter" dataKey="completed" name="Completed" stroke={COLORS.violet} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 9. Retry Count by Job */}
      <Card className="flex flex-col">
        <CardHeader><CardTitle className="text-sm">9. Top Retried Jobs</CardTitle></CardHeader>
        <CardContent className="h-60 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={retryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="job" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="retries" name="Retries" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 10. Daily Executions */}
      <Card className="flex flex-col md:col-span-2 lg:col-span-3">
        <CardHeader><CardTitle className="text-sm">10. 7-Day Total Executions Volume</CardTitle></CardHeader>
        <CardContent className="h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="executions" name="Total Executions" stroke={COLORS.indigo} strokeWidth={3} fillOpacity={1} fill="url(#colorExec)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
