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
import Link from "next/link";

interface PredictionData {
  closestCluster: number;
  distanceToCluster: number;
}

interface ApiResponse {
  statusCode: number;
  body: string;
}

export default function PredictionForm() {
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [recency, setRecency] = useState("");
  const [numPurchases, setNumPurchases] = useState("");
  const [income, setIncome] = useState("");
  const [totalSpent, setTotalSpent] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  function parseApiResponse(response: string | ApiResponse) {
    // If the response is already an object, use it directly
    const outerObject =
      typeof response === "string" ? JSON.parse(response) : response;

    // Check if we got a successful response
    if (outerObject.statusCode === 200) {
      // Parse the body string to get the inner object
      const bodyObject = JSON.parse(outerObject.body);

      // Parse the prediction string which is also JSON
      const closest_cluster = bodyObject.closest_cluster;
      const distance_to_cluster = bodyObject.distance_to_cluster;

      return {
        success: true,
        closestCluster: closest_cluster,
        distanceToCluster: distance_to_cluster,
      };
    } else {
      return {
        success: false,
        error: `API returned status code ${outerObject.statusCode}`,
      };
    }
  }

  const handlePredictionResponse = (data: string | ApiResponse) => {
    const parsedResult = parseApiResponse(data);

    if (parsedResult.success) {
      setPrediction({
        closestCluster: parsedResult.closestCluster,
        distanceToCluster: parsedResult.distanceToCluster,
      });
    } else {
      setError(parsedResult.error || "Unknown error occurred");
    }
  };

  function parseCSVInput(raw: string) {
    const numbers = raw.split(",").map((num) => {
      const val = parseFloat(num.trim());
      if (isNaN(val)) {
        // INSTRUCTION: This error indicates that the input is invalid.
        throw new Error("Invalid number encountered: " + num);
      }
      return val;
    });
    // Return object in the format expected by the API.
    return { instances: [numbers] };
  }

  async function predictData() {
    try {
      const options: SignedFetcherOptions = {
        service: "execute-api",
        region: "us-east-1",
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
          sessionToken: sessionToken,
        },
        fetch: fetch,
      };

      const signedFetch = createSignedFetcher(options);
      const url =
        "https://nmxhlfgpm2.execute-api.us-east-1.amazonaws.com/dev/cluster";

      const rawInput =
        recency + "," + numPurchases + "," + totalSpent + "," + income;
      const requestBody = parseCSVInput(rawInput);
      const response = await signedFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
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
      const data = await predictData();
      handlePredictionResponse(data);
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
        <CardTitle className="text-xl">Cluster Prediction</CardTitle>
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
          <div className="space-y-2">
            <label htmlFor="sessionToken" className="text-sm font-medium">
              Session Token
            </label>
            <Input
              id="sessionToken"
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
              placeholder="Enter your session token"
              type="password"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="sessionToken" className="text-sm font-medium">
              Recency
            </label>
            <Input
              id="recency"
              value={recency}
              onChange={(e) => setRecency(e.target.value)}
              placeholder="Enter number of days since customer's last purchase"
              required
            />
          </div>
          <label>Input 2</label>
          <Input
            value={numPurchases}
            onChange={(e) => setNumPurchases(e.target.value)}
          />
          <label>Input 3</label>
          <Input
            value={totalSpent}
            onChange={(e) => setTotalSpent(e.target.value)}
          />
          <label>Input 4</label>
          <Input value={income} onChange={(e) => setIncome(e.target.value)} />
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
            <div className="space-y-4">
              <p>Closest Cluster: {prediction.closestCluster}</p>
              <p>Distance to Cluster: {prediction.distanceToCluster}</p>
            </div>
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
