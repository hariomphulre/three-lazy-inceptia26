import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib,os

df=pd.read_csv("test5_synthetic.csv")
X=df.drop("label",axis=1)
y=df["label"]

model=RandomForestClassifier(n_estimators=400)
model.fit(X,y)

os.makedirs("models",exist_ok=True)
joblib.dump(model,"models/test5_model.pkl")
print("Test5 auditory model trained")
