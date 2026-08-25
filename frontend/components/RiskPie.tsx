"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#0f766e", "#b45309", "#b42318", "#1d4ed8"];

export function RiskPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={3}>
          {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
