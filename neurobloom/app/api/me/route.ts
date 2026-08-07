
import jwt from "jsonwebtoken"

export async function GET(req:Request){
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    try{
        const user=jwt.verify(token, process.env.JWT_SECRET!) as { userId: number, name: string };
        return new Response(JSON.stringify({ name: user.name }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }
}