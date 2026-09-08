import { useState } from 'react';
import { Bot, Send, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export function AIAssistantPage() {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<{ code: string; name: string; reason: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setSuggestions([]);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Chưa cấu hình GEMINI_API_KEY trong môi trường.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Bạn là một trợ lý y khoa chuyên nghiệp tại Việt Nam.
        Dựa vào các triệu chứng sau đây của bệnh nhân: "${symptoms}"
        
        Hãy gợi ý 3-5 mã bệnh ICD-10 (chuẩn Bộ Y Tế Việt Nam) phù hợp nhất.
        Trả về kết quả dưới dạng JSON array, mỗi object có cấu trúc:
        {
          "code": "Mã ICD (VD: J18.9)",
          "name": "Tên bệnh tiếng Việt",
          "reason": "Giải thích ngắn gọn tại sao mã này phù hợp với triệu chứng"
        }
        Chỉ trả về JSON, không kèm text nào khác.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        setSuggestions(parsed);
      } else {
        throw new Error("Không nhận được phản hồi từ AI.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi phân tích.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white mb-6 shadow-md flex-shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Suggest ICD</h1>
            <p className="text-indigo-100 mt-1">Gợi ý mã bệnh thông minh dựa trên triệu chứng lâm sàng</p>
          </div>
        </div>
        
        <div className="relative mt-6">
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Nhập triệu chứng lâm sàng, kết quả khám... (VD: Bệnh nhân nam 45 tuổi, sốt cao 39 độ, ho khan, khó thở nhẹ, đau tức ngực phải)"
            className="w-full h-32 p-4 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-300/50 outline-none resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                analyzeSymptoms();
              }
            }}
          />
          <button
            onClick={analyzeSymptoms}
            disabled={!symptoms.trim() || isAnalyzing}
            className="absolute bottom-4 right-4 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {suggestions.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Kết quả gợi ý:</h3>
            {suggestions.map((s, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-mono font-bold rounded-lg border border-indigo-100">
                    {s.code}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{s.name}</h4>
                    <p className="text-slate-600 mt-2 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">Lý do: </span>
                      {s.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>Lưu ý:</strong> Kết quả từ AI chỉ mang tính chất tham khảo hỗ trợ, bác sĩ cần kiểm tra lại trước khi quyết định mã ICD cuối cùng.
            </div>
          </div>
        ) : isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="relative">
              <Bot className="w-12 h-12 text-indigo-300 animate-pulse" />
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
            </div>
            <p>AI đang phân tích triệu chứng...</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Bot className="w-16 h-16 mb-4 opacity-20" />
            <p>Nhập triệu chứng và nhấn gửi để nhận gợi ý ICD</p>
          </div>
        )}
      </div>
    </div>
  );
}
