import { Bot, LoaderCircle, Sparkles, Wand2 } from 'lucide-react'
import type { AiAnalysisResult } from '../../types'

export function AiAnalysisBlock({
  isAnalyzing,
  result,
  onAutoFill,
}: {
  isAnalyzing: boolean
  result: AiAnalysisResult | null
  onAutoFill: () => void
}) {
  if (!isAnalyzing && !result) return null

  return (
    <div className="ai-block">
      <div className="ai-block-header">
        <Sparkles size={15} />
        Анализ изображения
      </div>

      {isAnalyzing ? (
        <div className="ai-loading">
          <LoaderCircle size={17} className="spin" />
          Анализируем фотографию...
        </div>
      ) : result ? (
        <div className="ai-result">
          <div className="ai-rows">
            <div className="ai-row">
              <span>Продукт</span>
              <strong>{result.productName}</strong>
            </div>
            <div className="ai-row">
              <span>Признаки</span>
              <strong>{result.signs.join(', ')}</strong>
            </div>
            <div className="ai-row">
              <span>Уверенность</span>
              <strong className="ai-confidence">{result.confidence}%</strong>
            </div>
          </div>
          <button type="button" className="button ai-fill-btn" onClick={onAutoFill}>
            <Wand2 size={15} />
            Заполнить автоматически
          </button>
        </div>
      ) : null}

      <div className="ai-badge">
        <Bot size={12} />
        AI-ассистент
      </div>
    </div>
  )
}
