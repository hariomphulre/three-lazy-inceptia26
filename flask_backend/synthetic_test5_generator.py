import numpy as np
import pandas as pd

np.random.seed(42)
rows=[]
labels=["normal","adhd","dyslexia","apd","asd"]

for _ in range(6000):
    label=np.random.choice(labels)

    if label=="normal":
        rts=np.random.normal([320,330,340,330,320],30)
        q2t,q2s= np.random.normal(3.5,0.5),1
        q3t,q3s= np.random.normal(3.2,0.5),1

    elif label=="adhd":
        rts=np.random.normal([200,450,180,500,220],80)
        q2t,q2s= np.random.normal(2.5,0.5),np.random.binomial(1,0.6)
        q3t,q3s= np.random.normal(2.5,0.5),np.random.binomial(1,0.6)

    elif label=="dyslexia":
        rts=np.random.normal([400,420,450,430,410],50)
        q2t,q2s= np.random.normal(5,1),np.random.binomial(1,0.6)
        q3t,q3s= np.random.normal(6,1),np.random.binomial(1,0.3)

    elif label=="apd":
        rts=np.random.normal([600,650,620,700,680],60)
        q2t,q2s= np.random.normal(6,1),np.random.binomial(1,0.4)
        q3t,q3s= np.random.normal(6,1),np.random.binomial(1,0.4)

    else: # ASD
        rts=np.random.normal([500,300,700,250,650],150)
        q2t,q2s= np.random.normal(5,1),np.random.binomial(1,0.6)
        q3t,q3s= np.random.normal(5,1),np.random.binomial(1,0.6)

    rows.append(list(rts)+[q2t,q2s,q3t,q3s,label])

df=pd.DataFrame(rows,columns=[
"r1","r2","r3","r4","r5",
"q2_time","q2_score",
"q3_time","q3_score","label"
])

df.to_csv("test5_synthetic.csv",index=False)
print("Test5 synthetic dataset created")
