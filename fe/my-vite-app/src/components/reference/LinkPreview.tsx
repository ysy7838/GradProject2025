import { useState, useEffect } from "react";
import { Loader } from "lucide-react";

interface LinkPreviewProps {
  url: string;
}

interface MetaData {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // CORS 이슈를 우회하기 위해 allorigins.win 프록시 서비스 사용
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
          url
        )}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.contents) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.contents, "text/html");

          const meta: MetaData = {
            title:
              doc
                .querySelector('meta[property="og:title"]')
                ?.getAttribute("content") ||
              doc.querySelector("title")?.textContent ||
              "",
            description:
              doc
                .querySelector('meta[property="og:description"]')
                ?.getAttribute("content") ||
              doc
                .querySelector('meta[name="description"]')
                ?.getAttribute("content") ||
              "",
            image:
              doc
                .querySelector('meta[property="og:image"]')
                ?.getAttribute("content") || "",
            favicon:
              doc.querySelector('link[rel="icon"]')?.getAttribute("href") ||
              doc
                .querySelector('link[rel="shortcut icon"]')
                ?.getAttribute("href") ||
              new URL("/favicon.ico", url).href,
          };

          setMetadata(meta);
        }
      } catch (err) {
        console.error("Error fetching metadata:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
        <Loader className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !metadata) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 border border-gray-200 rounded-lg overflow-hidden hover:border-primary transition-colors"
    >
      <div className="flex p-4 gap-4">
        {metadata.image && (
          <div className="flex-shrink-0 w-24 h-24">
            <img
              src={metadata.image}
              alt={metadata.title || "Preview"}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-medium text-gray-900 truncate mb-1">
            {metadata.title}
          </h4>
          {metadata.description && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {metadata.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {metadata.favicon && (
              <img
                src={metadata.favicon}
                alt="favicon"
                className="w-4 h-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="text-sm text-gray-400 truncate">
              {new URL(url).hostname}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
