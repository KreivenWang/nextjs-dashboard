'use client';
import { useState } from "react";

interface SalaryStructure {
  yearly: number;
  monthly: number;
  month: number;
}

const potentialMonths = [12, 13, 13.5, 14];
const increaseRatios = [0.3, 0.25, 0.2, 0.15, 0.1];

const Page = () => {
  const [curSalary, setCurSalary] = useState<SalaryStructure>({
    yearly: 0,
    monthly: 0,
    month: 12,
  });
  const handleCurSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    switch (e.target.name) {
      case "yearly":
        setCurSalary({ yearly: value, monthly: value / 12, month: 12 });
        break;
      case "monthly":
        setCurSalary({ yearly: value * 12, monthly: value, month: 12 });
        break;
      case "month":
        setCurSalary({
          yearly: value * curSalary.monthly,
          monthly: curSalary.monthly,
          month: value,
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Current Salary : (RMB)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Annual Salary</label>
          <input
            type="number"
            name="yearly"
            value={curSalary.yearly}
            onChange={handleCurSalaryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Monthly Salary</label>
          <input
            type="number"
            name="monthly"
            value={curSalary.monthly}
            onChange={handleCurSalaryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Number of Months</label>
          <input
            type="number"
            name="month"
            value={curSalary.month}
            onChange={handleCurSalaryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Salary Increases</h3>
        {increaseRatios.map((upRatio) => (
          <div key={upRatio} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-lg font-bold mb-2 text-blue-600">+{upRatio * 100}%</h4>
            <div className="text-sm text-gray-600 mb-3">
              Yearly:{" "}
              <span className="font-semibold">
                {Number(
                  (curSalary.yearly * (1 + upRatio)).toFixed(0)
                ).toLocaleString("en")}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {potentialMonths.map((m) => (
                <SalaryUp
                  key={`${upRatio}-${m}`}
                  annualSalary={curSalary.yearly}
                  month={m}
                  upRatio={upRatio}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SalaryUp = ({
  annualSalary,
  month,
  upRatio,
}: {
  annualSalary: number;
  month: number;
  upRatio: number;
}) => {
  const ratio = 1 + upRatio;
  const upAnnualSalary = annualSalary * ratio;
  return (
    <div className="p-3 bg-white rounded-md shadow-sm border border-gray-200">
      <h5 className="text-sm font-semibold mb-1 text-gray-800">x{month} months</h5>
      <div className="text-sm text-gray-600">
        Monthly:{" "}
        <span className="font-medium">
          {Number((upAnnualSalary / month).toFixed(0)).toLocaleString("en")}
        </span>
      </div>
    </div>
  );
};

export default Page;
