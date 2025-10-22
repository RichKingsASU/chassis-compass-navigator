import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Match {
  line_id: number;
  invoice_id: string;
  content: string;
  similarity: number;
  raw_data: any;
}

export function VendorChatSearch() {
  const [question, setQuestion] = useState("");
  const [vendor, setVendor] = useState<string>("all");
  const [matches, setMatches] = useState<Match[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search question",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-vendors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            question,
            vendor: vendor === "all" ? null : vendor,
            k: 8,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }

      const data = await res.json();
      setMatches(data.matches || []);

      if (!data.matches || data.matches.length === 0) {
        toast({
          title: "No Results",
          description: "No matching invoice lines found for your question.",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Search failed",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewLine = (match: Match) => {
    // Navigate to the invoice line detail page
    if (match.invoice_id && match.line_id) {
      navigate(`/invoices/${match.invoice_id}/lines/${match.line_id}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <Select value={vendor} onValueChange={setVendor}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                <SelectItem value="DCLI">DCLI</SelectItem>
                <SelectItem value="TRAC">TRAC</SelectItem>
                <SelectItem value="FLEXIVAN">FLEXIVAN</SelectItem>
                <SelectItem value="CCM">CCM</SelectItem>
                <SelectItem value="WCCP">WCCP</SelectItem>
                <SelectItem value="SCSPA">SCSPA</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Ask a question about invoices... (e.g., 'Show me high-value chassis charges')"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results ({matches.length})</h3>
          {matches.map((match, idx) => (
            <Card
              key={idx}
              className="p-4 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleViewLine(match)}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{match.content}</p>
                    {match.raw_data && (
                      <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-2">
                        <div>Invoice: {match.raw_data.invoice_number}</div>
                        <div>Chassis: {match.raw_data.chassis}</div>
                        <div>
                          Amount: ${Number(match.raw_data.grand_total || 0).toFixed(2)}
                        </div>
                        <div>
                          Match Score: {(match.similarity * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
