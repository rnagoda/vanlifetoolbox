import { useState } from 'react';

const calculators = [
  {
    id: 'power',
    name: 'Daily Power Consumption',
    description: 'Calculate your daily power needs based on devices and usage',
  },
  {
    id: 'solar',
    name: 'Solar Panel Sizing',
    description: 'Determine how many watts of solar you need',
  },
  {
    id: 'battery',
    name: 'Battery Bank Sizing',
    description: 'Calculate the amp-hours needed for your battery bank',
  },
  {
    id: 'inverter',
    name: 'Inverter Sizing',
    description: 'Find the right inverter size for your needs',
  },
  {
    id: 'wire',
    name: 'Wire Gauge',
    description: 'Determine the proper wire gauge for your circuits',
  },
  {
    id: 'capacity',
    name: 'Capacity/Runtime',
    description: 'Calculate how long your batteries will last',
  },
];

export default function Calculators() {
  const [activeCalculator, setActiveCalculator] = useState('power');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Electrical Calculators</h1>
        <p className="mt-2 text-gray-600">
          Plan your off-grid electrical system with these calculators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calculator Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {calculators.map((calc) => (
              <button
                key={calc.id}
                onClick={() => setActiveCalculator(calc.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeCalculator === calc.id
                    ? 'bg-green-50 text-green-700 border-l-4 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium block">{calc.name}</span>
                <span className="text-sm text-gray-500 block mt-1">{calc.description}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Calculator Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {calculators.find((c) => c.id === activeCalculator)?.name}
            </h2>
            <p className="text-gray-500">
              Calculator implementation coming soon.
            </p>
            {/* TODO: Individual calculator components */}
          </div>
        </div>
      </div>
    </div>
  );
}
