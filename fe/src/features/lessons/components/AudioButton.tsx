import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * Nút phát âm cho bài nghe.
 *
 * Ưu tiên file audio do admin nhập; nếu không có thì dùng giọng đọc sẵn của trình
 * duyệt (Web Speech API) — nhờ vậy luyện nghe chạy được ngay mà không cần chuẩn bị
 * hàng trăm file âm thanh.
 *
 * Trình duyệt không hỗ trợ đọc thì báo rõ cho người học, không im lặng để họ
 * ngồi chờ một âm thanh không bao giờ phát.
 */

/** Trình duyệt có đọc được tiếng Anh không. */
function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function AudioButton({
  text,
  audioUrl,
  /** Tự phát ngay khi hiện câu hỏi — bài nghe thì nghe trước rồi mới trả lời. */
  autoPlay = false,
  size = 'lg',
}: {
  text: string;
  audioUrl?: string | null;
  autoPlay?: boolean;
  size?: 'sm' | 'lg';
}): JSX.Element {
  const [playing, setPlaying] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = (): void => {
    if (audioUrl) {
      audioRef.current ??= new Audio(audioUrl);
      setPlaying(true);
      void audioRef.current.play().finally(() => setPlaying(false));
      return;
    }

    if (!canSpeak()) {
      setUnsupported(true);
      return;
    }

    // Huỷ câu đang đọc dở, tránh chồng tiếng khi bấm liên tiếp
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    // Đọc chậm hơn bình thường để người học nghe rõ từng âm
    utterance.rate = 0.85;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => {
      setPlaying(false);
      setUnsupported(true);
    };
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!autoPlay) return;
    // Chờ một nhịp cho giọng đọc nạp xong, nếu không lần phát đầu hay bị câm
    const timer = setTimeout(play, 350);
    return () => {
      clearTimeout(timer);
      if (canSpeak()) window.speechSynthesis.cancel();
    };
  }, [text, audioUrl]);

  if (unsupported) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <VolumeX className="h-7 w-7 text-slate-400" aria-hidden />
        </div>
        {/* Trình duyệt không đọc được thì hiện chữ, thà mất tính chất bài nghe
            còn hơn để người học kẹt không làm tiếp được */}
        <p className="text-sm text-slate-500">
          Trình duyệt không phát âm được — từ cần nghe là <strong>{text}</strong>
        </p>
      </div>
    );
  }

  const isLarge = size === 'lg';

  return (
    <button
      type="button"
      onClick={play}
      aria-label="Nghe lại"
      className={`flex items-center justify-center rounded-full bg-brand text-white transition-transform hover:bg-brand-strong active:scale-95 ${
        isLarge ? 'h-16 w-16' : 'h-9 w-9'
      } ${playing ? 'animate-pulse-soft' : ''}`}
    >
      <Volume2 className={isLarge ? 'h-7 w-7' : 'h-4 w-4'} aria-hidden />
    </button>
  );
}
