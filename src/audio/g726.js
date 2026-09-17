// G.726 24 kbps ADPCM decoder (port of the public-domain Sun g72x reference), 3-bit codes packed LSB-first
export function decodeG726(b){
  const s16=x=>x<<16>>16,P2=[1,2,4,8,16,32,64,128,256,512,1024,2048,4096,8192,16384];
  const quan=v=>{let i=0;while(i<15&&v>=P2[i])i++;return i};
  const st={yl:34816,yu:544,dms:0,dml:0,ap:0,a:[0,0],b:[0,0,0,0,0,0],pk:[0,0],dq:[32,32,32,32,32,32],sr:[32,32],td:0};
  const fmult=(an,srn)=>{const mag=an>0?an:((-an)&0x1FFF),ex=quan(mag)-6,mant=mag===0?32:ex>=0?mag>>ex:mag<<-ex;
    const wex=ex+((srn>>6)&15)-13,wm=(mant*(srn&63)+0x30)>>4,r=wex>=0?(wm<<wex)&0x7FFF:wm>>-wex;return (an^srn)<0?-r:r};
  const DQLN=[-2048,135,273,373,373,273,135,-2048],WI=[-128,960,4384,18624,18624,4384,960,-128],FI=[0,0x200,0x400,0xE00,0xE00,0x400,0x200,0];
  const nsamp=(b.length*8/3)|0,out=new Int16Array(nsamp);let acc=0,bits=0,bp=0;
  for(let n=0;n<nsamp;n++){
    while(bits<3){acc|=b[bp++]<<bits;bits+=8}const i=acc&7;acc>>=3;bits-=3;
    let sezi=fmult(st.b[0]>>2,st.dq[0]);for(let k=1;k<6;k++)sezi+=fmult(st.b[k]>>2,st.dq[k]);
    const sez=sezi>>1,se=(sezi+fmult(st.a[1]>>2,st.sr[1])+fmult(st.a[0]>>2,st.sr[0]))>>1;
    let y;if(st.ap>=256)y=st.yu;else{y=st.yl>>6;const dif=st.yu-y,al=st.ap>>2;if(dif>0)y+=(dif*al)>>6;else if(dif<0)y+=(dif*al+0x3F)>>6}
    const sign=i&4,dql=DQLN[i]+(y>>2);let dq;
    if(dql<0)dq=sign?-0x8000:0;else{const dex=(dql>>7)&15,dqt=128+(dql&127);dq=(dqt<<7)>>(14-dex);if(sign)dq-=0x8000}
    const sr=dq<0?se-(dq&0x3FFF):se+dq,dqsez=sr-se+sez;
    const pk0=dqsez<0?1:0,mag=dq&0x7FFF,ylint=st.yl>>15,ylfrac=(st.yl>>10)&0x1F,thr1=(32+ylfrac)<<ylint,thr2=ylint>9?31<<10:thr1,dqthr=(thr2+(thr2>>1))>>1;
    const tr=st.td===0?0:mag<=dqthr?0:1;
    st.yu=y+((WI[i]-y)>>5);if(st.yu<544)st.yu=544;else if(st.yu>5120)st.yu=5120;
    st.yl+=st.yu+((-st.yl)>>6);
    let a2p=0;
    if(tr){st.a=[0,0];st.b=[0,0,0,0,0,0]}
    else{const pks1=pk0^st.pk[0];a2p=st.a[1]-(st.a[1]>>7);
      if(dqsez!==0){const fa1=pks1?st.a[0]:-st.a[0];
        if(fa1<-8191)a2p-=0x100;else if(fa1>8191)a2p+=0xFF;else a2p+=fa1>>5;
        if(pk0^st.pk[1]){if(a2p<=-12160)a2p=-12288;else if(a2p>=12416)a2p=12288;else a2p-=0x80}
        else if(a2p<=-12416)a2p=-12288;else if(a2p>=12160)a2p=12288;else a2p+=0x80}
      st.a[1]=s16(a2p);st.a[0]-=st.a[0]>>8;
      if(dqsez!==0)st.a[0]+=pks1===0?192:-192;
      const a1ul=15360-a2p;if(st.a[0]<-a1ul)st.a[0]=-a1ul;else if(st.a[0]>a1ul)st.a[0]=a1ul;st.a[0]=s16(st.a[0]);
      for(let c=0;c<6;c++){st.b[c]-=st.b[c]>>8;if(mag)st.b[c]+=((dq^st.dq[c])>=0)?128:-128;st.b[c]=s16(st.b[c])}}
    for(let c=5;c>0;c--)st.dq[c]=st.dq[c-1];
    if(mag===0)st.dq[0]=dq>=0?0x20:s16(0xFC20);else{const ex=quan(mag);st.dq[0]=s16(dq>=0?(ex<<6)+((mag<<6)>>ex):(ex<<6)+((mag<<6)>>ex)-0x400)}
    st.sr[1]=st.sr[0];
    if(sr===0)st.sr[0]=0x20;else if(sr>0){const ex=quan(sr);st.sr[0]=(ex<<6)+((sr<<6)>>ex)}
    else if(sr>-32768){const m2=-sr,ex=quan(m2);st.sr[0]=s16((ex<<6)+((m2<<6)>>ex)-0x400)}else st.sr[0]=s16(0xFC20);
    st.pk[1]=st.pk[0];st.pk[0]=pk0;
    st.td=tr?0:a2p<-11776?1:0;
    st.dms+=(FI[i]-st.dms)>>5;st.dml+=((FI[i]<<2)-st.dml)>>7;
    if(tr)st.ap=256;else if(y<1536)st.ap+=(0x200-st.ap)>>4;else if(st.td)st.ap+=(0x200-st.ap)>>4;
    else if(Math.abs((st.dms<<2)-st.dml)>=(st.dml>>3))st.ap+=(0x200-st.ap)>>4;else st.ap+=(-st.ap)>>4;
    const o=sr<<2;out[n]=o>32767?32767:o<-32768?-32768:o}
  return out}

