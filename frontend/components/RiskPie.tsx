"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

const colors = ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]; // Mint, Amber, Danger, Purple

export function RiskPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          stroke="#ffffff"
          strokeWidth={2}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            color: "#0f172a",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          }}
          itemStyle={{
            color: "#0f172a",
            fontWeight: "600"
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => <span style={{ color: "#475569", fontSize: "12px", fontWeight: "500" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
