पाठ सुनें — v7

अब reader में हर readable Sanskrit/Hindi token को span में रखा जाता है।
Browser speechSynthesis का onboundary event मिलने पर current word:
- highlight होता है
- 1.14x zoom होता है
- smooth scroll होकर बीच में आता है

महत्वपूर्ण:
Android/Chrome में word-boundary support installed TTS engine पर निर्भर करता है।
यदि engine onboundary event नहीं देता, आवाज चलेगी लेकिन exact word highlight नहीं हो पाएगा।
Sanskrit के लिए sa-IN voice पहले खोजी जाती है; उपलब्ध न होने पर Hindi voice fallback हो सकती है।

अगले professional upgrade के लिए server-side timed Sanskrit audio + word timestamps सबसे भरोसेमंद तरीका है।
