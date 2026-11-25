let cachedVoices = [];

function loadUKVoices() {
  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

// iOS Safari cần lắng nghe voiceschanged để nạp đủ giọng hệ thống
if ('speechSynthesis' in window) {
  loadUKVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadUKVoices();
  };
}

function pickBestUKVoice() {
  const voices = loadUKVoices();
  const ukVoices = voices.filter(v => /en[-_]GB/i.test(v.lang));

  if (ukVoices.length === 0) return null;

  // Ưu tiên các giọng mượt/tự nhiên trên Apple/iOS, tránh giọng lỗi/trầm nếu có
  const preferredOrder = [
    /daniel/i,
    /arthur/i,
    /martha/i,
    /kate/i,
    /serena/i,
    /oliver/i,
    /google uk english/i
  ];

  for (const pattern of preferredOrder) {
    const match = ukVoices.find(v => pattern.test(v.name));
    if (match) return match;
  }

  // Ưu tiên localService trên iOS vì chạy offline mượt, ít bị trễ/méo hơn
  return ukVoices.find(v => v.localService) || ukVoices[0];
}

function speakUK(text, slow = false) {
  if (!('speechSynthesis' in window) || !text) return;

  const synth = window.speechSynthesis;

  // Tránh lỗi kẹt/méo tiếng trên iOS khi bấm nút Nghe liên tục
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text.trim());
  const voice = pickBestUKVoice();

  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang;
  } else {
    utter.lang = 'en-GB';
  }

  // Giữ pitch chuẩn (1.0 - 1.05) để không bị giọng trầm ồm kiểu "âm trì"
  // Trên iOS, tốc độ chậm không nên hạ xuống dưới 0.72 để tránh bị kéo âm méo tiếng
  utter.pitch = 1.02;
  utter.rate = slow ? 0.75 : 0.96;
  utter.volume = 1.0;

  // Fix lỗi iOS Safari đôi khi bị "nuốt" hoặc dừng giữa chừng với câu dài
  setTimeout(() => {
    synth.speak(utter);
  }, 60);
}