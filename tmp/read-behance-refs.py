import pypdfium2 as pdf
from pathlib import Path
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
out=Path('tmp/pdfs/new-references');out.mkdir(parents=True,exist_ok=True)
files=[next(Path('C:/Users/ramon/Downloads').glob('Lifestyle App Design*Behance.pdf')),next(Path('C:/Users/ramon/Downloads').glob('UNLABELED*Behance.pdf'))]
for k,f in enumerate(files):
 d=pdf.PdfDocument(str(f));print(k,f.name,len(d))
 for j,p in enumerate(d):
  im=p.render(scale=.6).to_pil(); w,h=im.size;print(j,w,h)
  for n,y in enumerate(range(0,h,1800)):
   tile=im.crop((0,y,w,min(y+1800,h)));tile.thumbnail((1100,1500));tile.save(out/('ref-%s-%s-%s.jpg'%(k,j,n)))
