"""Generate local neural speech. Resume safely; only missing files are generated."""
import asyncio,json
from pathlib import Path
import edge_tts
root=Path(__file__).resolve().parents[1]
out=root/'assets'/'speech';out.mkdir(parents=True,exist_ok=True)
async def main():
 sem=asyncio.Semaphore(4);done=0;failed=[]
 async def one(e,field,lang):
  nonlocal done
  target=out/f"{e['id']}-{field}.mp3"
  if target.exists() and target.stat().st_size>1000:return
  async with sem:
   for attempt in range(3):
    try:
     text=e[field]
     if field=='en' and text=='TNT':text='T N T'
     await asyncio.wait_for(edge_tts.Communicate(text,'zh-CN-XiaoxiaoNeural' if lang=='zh' else 'en-US-JennyNeural',rate='-10%').save(str(target)),35)
     done+=1
     if done%20==0:print(f'Generated {done} clips',flush=True)
     return
    except Exception:
     await asyncio.sleep(1+attempt)
   failed.append(target.name)
 data=json.loads((root/'curriculum.json').read_text(encoding='utf8'))
 await asyncio.gather(*(one(e,f,l) for level in data['levels'] for e in level['words'] for f,l in [('cn','zh'),('en','en'),('sentenceCn','zh'),('sentenceEn','en')]))
 print(json.dumps({'files':len(list(out.glob('*.mp3'))),'failed':failed}),flush=True)
 if failed:raise SystemExit(1)
asyncio.run(main())
