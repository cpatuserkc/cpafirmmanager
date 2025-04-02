import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Define types for chart components
type ChartComponentProps = {
  data: ChartData<any, any, any>;
  options?: ChartOptions<any>;
  height?: number;
};

// Line Chart Component
export const LineChart: React.FC<ChartComponentProps> = ({ data, options, height }) => {
  return (
    <div style={{ height: height || 'auto', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
};

// Bar Chart Component
export const BarChart: React.FC<ChartComponentProps> = ({ data, options, height }) => {
  return (
    <div style={{ height: height || 'auto', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

// Pie Chart Component
export const PieChart: React.FC<ChartComponentProps> = ({ data, options, height }) => {
  return (
    <div style={{ height: height || 'auto', width: '100%' }}>
      <Pie data={data} options={options} />
    </div>
  );
};