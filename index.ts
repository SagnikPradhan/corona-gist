import "source-map-support/register";
import fetch from "node-fetch";

// Main Function
async function main(): Promise<void> {
  // Configuration
  const config = (await import("./config.json")).default;
  const gistId = config["GIST-ID"] || process.env["GIST-ID"] || "";
  const username = config["USERNAME"] || process.env["GH-USERNAME"] || "";
  const accessToken = process.env["ACCESS-TOKEN"] || "";

  // Main code itself
  const data = await getData();
  const footerText = "Stay home bud!";
  const content = await formatData({ data, footerText });
  await publishGist({ content, gistId, username, accessToken });
}

interface Data {
  "🤒 Confirmed": number;
  "😵 Deaths": number;
  "😄 Recovered": number;
}

/**
 * Gets required data from the API
 */
async function getData(): Promise<Data> {
  const apiUrl = "https://api.covid19api.com/summary";

  const response = await fetch(apiUrl);
  const body: Record<string, any> = await response.json();
  const globalData: Record<string, number> = body.Global;

  const confirmed = globalData.TotalConfirmed;
  const deaths = globalData.TotalDeaths;
  const recovered = globalData.TotalRecovered;

  return {
    "🤒 Confirmed": confirmed,
    "😵 Deaths": deaths,
    "😄 Recovered": recovered,
  };
}

/**
 * Format data into string
 * @param options - Options
 * @param options.data - Data
 * @param options.text - Text to be added any
 * @param options.length - Length of each line
 * @param options.blockChars - Block characters used to draw the graph
 */
async function formatData({
  data,
  footerText = "",
  length = 60,
  blockChars = ["▓", "▒", "░"],
}: {
  data: Data;
  footerText?: string;
  length?: number;
  blockChars?: string[];
}): Promise<string> {
  // Used to draw the graphs
  blockChars = blockChars.sort();

  // Sorted Entries
  const entries: [string, number][] = Object.entries(data).sort(
    ([, val1], [, val2]) => val2 - val1
  );

  // Max label length and Max entries value
  const maxLblLen =
    entries.reduce(
      (curLen, [lbl]) => (lbl.length > curLen ? lbl.length : curLen),
      0
    ) + 1;
  const maxValue = entries[0][1];

  // Graphing space
  const graphSpace = length - maxLblLen;

  // Convert entries into lines and randomise the order
  const linesStr = entries
    .map(
      ([label, val], i) =>
        label +
        " ".repeat(maxLblLen - label.length) +
        blockChars[i].repeat(Math.floor((val / maxValue) * graphSpace))
    )
    .sort(() => (Math.floor(Math.random() * 2) === 1 ? -1 : 1));

  // Join the array and add text
  return linesStr.join("\n") + "\n" + footerText;
}

/**
 * Publish content to gist
 * @param options - Options
 * @param options.content - Content of file
 * @param options.gistId - Id of gist
 * @param options.username - Authors username
 * @param options.accessToken - Authors access token
 */
async function publishGist({
  content,
  gistId,
  username,
  accessToken,
}: {
  content: string;
  gistId: string;
  username: string;
  accessToken: string;
}) {
  const endpoint = `https://api.github.com/gists/${gistId}`;
  const auth = Buffer.from(`${username}:${accessToken}`).toString("base64");
  const body = {
    description: "COVID 19 Update",
    files: { "status.txt": { content } },
  };

  // Make the request
  await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
