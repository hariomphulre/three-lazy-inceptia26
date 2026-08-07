import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib, os

df=pd.read_csv("test6_synthetic.csv")
X=df.drop("label",axis=1)
y=df["label"]

model=RandomForestClassifier(n_estimators=500)
model.fit(X,y)

os.makedirs("models",exist_ok=True)
joblib.dump(model,"models/test6_model.pkl")

print("Test6 model retrained with 14 features")
