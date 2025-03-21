"use client";
import React, { useState, useEffect } from "react";

interface PredictionData {
  selected_row: Record<string, string | number>;
  prediction: string;
}

const API_URL = "YOUR_API_GATEWAY_URL"; // Replace with actual API Gateway URL

const PredictionApp: React.FC = () => {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      const result: PredictionData = await response.json();
      setData(result);
    } catch (err) {
      setError("Failed to fetch prediction");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrediction();
  }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">ML Model Prediction</h1>
      <div className="w-full max-w-2xl p-4 border border-gray-300 rounded-lg shadow-md">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : data ? (
          <div>
            <h2 className="text-lg font-semibold mb-2">Selected Data Row</h2>
            <table className="w-full border border-gray-300 rounded-md mb-4">
              <tbody>
                {Object.entries(data.selected_row).map(([key, value]) => (
                  <tr key={key} className="border-b">
                    <td className="p-2 font-medium text-gray-700">{key}</td>
                    <td className="p-2">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h2 className="text-lg font-semibold mt-4">Model Prediction</h2>
            <p className="text-xl font-bold text-blue-600">{data.prediction}</p>
          </div>
        ) : (
          <p>No data available</p>
        )}
        <button
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={fetchPrediction}
          disabled={loading}
        >
          Get New Prediction
        </button>
      </div>
    </div>
  );
};

export default PredictionApp;
