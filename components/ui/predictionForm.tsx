"use client";

import { createSignedFetcher, SignedFetcherOptions } from "aws-sigv4-fetch";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PredictionData {
  selected_row: Record<string, string | number>;
  prediction: string;
}

export default function PredictionForm() {
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function predictData() {
    try {
      // Use the input credentials instead of hardcoded values
      const options: SignedFetcherOptions = {
        service: "execute-api",
        region: "us-east-1",
        credentials: {
          accessKeyId: "ASIASREVVU6OVVIKMKDX",
          secretAccessKey: "SYmjUbZphTdImjbQqnyiuMo8EiWEuKjvZs4cW23i",
          // Remove the sessionToken unless you're specifically using temporary credentials
        },
        fetch: fetch,
      };

      const signedFetch = createSignedFetcher(options);
      const url =
        "https://0k4ujycugb.execute-api.us-east-1.amazonaws.com/dev/predict";

      const response = await signedFetch(url, {
        method: "GET",
        // Add these headers to handle CORS and content type
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      // Parse the response as JSON
      const data = await response.json();
      console.log("API Response:", data);
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setError(null);

    try {
      // Call the API
      const data = await predictData();

      // Format the prediction data for display
      if (data && data.prediction !== undefined) {
        // If data has a specific structure, format accordingly
        if (data.selected_row) {
          setPrediction(`Prediction: ${data.prediction}

    Features: ${JSON.stringify(data.selected_row, null, 2)}`);
        } else {
          setPrediction(`Prediction: ${data.prediction}`);
        }
      } else {
        setPrediction(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Error fetching prediction"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Churn Model Prediction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="accessKey" className="text-sm font-medium">
              Access Key
            </label>
            <Input
              id="accessKey"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Enter your access key"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="secretKey" className="text-sm font-medium">
              Secret Key
            </label>
            <Input
              id="secretKey"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter your secret key"
              type="password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Prediction...
              </>
            ) : (
              "Get New Prediction"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <div className="w-full p-4 bg-muted rounded-md min-h-[100px] overflow-auto">
          {loading ? (
            <p className="text-muted-foreground flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing request...
            </p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : prediction ? (
            <pre className="whitespace-pre-wrap break-words">{prediction}</pre>
          ) : (
            <p className="text-muted-foreground">
              Prediction results will appear here
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
