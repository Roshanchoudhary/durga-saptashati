v8 Professional TTS Word Focus

पाठ सुनें अब:
- प्रत्येक readable token को span में बदलता है।
- TTS onboundary event मिलने पर exact token highlight + 1.16x zoom + smooth scroll।
- Android engines में onboundary उपलब्ध न होने पर conservative timed fallback चलता है।
- वास्तविक boundary event मिलते ही fallback बंद हो जाता है।
- Sanskrit के लिए sa-IN voice पहले चुनी जाती है; उपलब्ध न होने पर Hindi/available fallback।
- ~ marker invisible रहता है।
- Anushtubh A-B-B-A रंग बने रहते हैं।

महत्वपूर्ण:
Browser TTS में Sanskrit voice की गुणवत्ता और boundary support डिवाइस/installed voice पर निर्भर है।
100% exact synchronized Sanskrit audio के लिए server-generated timed audio (audio file + word timestamps) अगला और सबसे reliable production architecture है।
