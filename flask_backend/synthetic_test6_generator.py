import numpy as np
import pandas as pd

np.random.seed(42)
labels=["normal","adhd","dyslexia","dyscalculia","asd","intellectual"]
rows=[]

for _ in range(5000):
    label=np.random.choice(labels)

    if label=="normal":
        s=[1,1,1,1]
        t=np.random.normal([3,4,4,3],0.6)

    elif label=="adhd":
        s=np.random.binomial(1,[0.6,0.4,0.7,0.6])
        t=np.random.normal([2,3,3,2],0.5)

    elif label=="dyslexia":
        s=np.random.binomial(1,[0.7,0.4,0.8,0.7])
        t=np.random.normal([6,7,6,6],1)

    elif label=="dyscalculia":
        s=np.random.binomial(1,[0.8,0.6,0.4,0.3])
        t=np.random.normal([6,6,7,7],1)

    elif label=="asd":
        s=np.random.binomial(1,[0.9,0.8,0.9,0.8])
        t=np.random.normal([7,7,7,7],1)

    else:
        s=np.random.binomial(1,[0.3,0.3,0.3,0.3])
        t=np.random.normal([8,8,8,8],1)

    avg=np.mean(t)
    var=np.std(t)
    impulsivity=1/avg
    visual=(s[0]+s[2])/2
    logic=s[3]
    memory=s[1]

    rows.append(list(s)+list(t)+[avg,var,impulsivity,visual,logic,memory,label])

df=pd.DataFrame(rows,columns=[
    "odd","memory","mirror","pattern",
    "odd_time","memory_time","mirror_time","pattern_time",
    "avg","var","impulsivity","visual","logic","memory_skill","label"
])

df.to_csv("test6_synthetic.csv",index=False)
print("Synthetic dataset regenerated")
