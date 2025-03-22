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
  selected_row: Record<string, string | number>;
  prediction: string;
}

interface ApiResponse {
  statusCode: number;
  body: string;
}

export default function PredictionForm() {
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // First, parse the outer response (if it's a string)
  function parseApiResponse(response: string | ApiResponse) {
    // If the response is already an object, use it directly
    const outerObject =
      typeof response === "string" ? JSON.parse(response) : response;

    // Check if we got a successful response
    if (outerObject.statusCode === 200) {
      // Parse the body string to get the inner object
      const bodyObject = JSON.parse(outerObject.body);

      // Extract prediction information
      const selectedRow = bodyObject.selected_row;

      // Parse the prediction string which is also JSON
      const predictionObj = JSON.parse(bodyObject.prediction);
      const score = predictionObj.predictions[0].score;
      const predictedLabel = predictionObj.predictions[0].predicted_label;

      return {
        success: true,
        selectedRow,
        score,
        predictedLabel,
        raw: {
          outer: outerObject,
          body: bodyObject,
          prediction: predictionObj,
        },
      };
    } else {
      return {
        success: false,
        error: `API returned status code ${outerObject.statusCode}`,
      };
    }
  }

  // Example usage in your predictData function
  const handlePredictionResponse = (data: string | ApiResponse) => {
    const parsedResult = parseApiResponse(data);

    if (parsedResult.success) {
      // Format for display
      setPrediction({
        selected_row: parsedResult.selectedRow,
        prediction: `Predicted Label: ${parsedResult.predictedLabel} (Score: ${(
          parsedResult.score * 100
        ).toFixed(2)}%)`,
      });
    } else {
      setError(parsedResult.error || "Unknown error occurred");
    }
  };

  async function predictData() {
    try {
      // Use the input credentials instead of hardcoded values
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
        "https://0k4ujycugb.execute-api.us-east-1.amazonaws.com/dev/predict";

      const response = await signedFetch(url, {
        method: "GET",
        // Add these headers to handle CORS and content type
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      // Parse the response as JSON
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
      // Call the API
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
        <CardTitle className="text-xl">Churn Model Prediction</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Link
            href="https://github.com/ryanvandrunen/comm493/blob/main/README.md"
            target="_blank"
            className="text-blue-600 hover:text-blue-800 underline hover:no-underline"
          >
            Where do I get this information?
          </Link>
        </div>
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
              <div>
                <h3 className="font-medium mb-2">Prediction Result:</h3>
                <p>{prediction.prediction}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Selected Features:</h3>
                <pre className="whitespace-pre-wrap break-words text-sm">
                  {JSON.stringify(prediction.selected_row, null, 2)}
                </pre>
              </div>
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
