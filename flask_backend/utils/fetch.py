from utils.db import get_connection

def fetch_session(session_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            test1_q1, test1_q2, test1_q3, test1_q4, test1_q5, test1_q6,
            test1_q1_time, test1_q2_time, test1_q3_time,
            test1_q4_time, test1_q5_time, test1_q6_time,
            test2_audio1,
            test2_audio2,
            test3_image,
            test5_q1_r1, test5_q1_r2, test5_q1_r3, test5_q1_r4,test5_q1_r5,
            test5_q2_time,test5_q2_score, test5_q3_time, test5_q3_score,
            test4_q1, test4_q2, test4_q3, test4_q4,
            test4_q1_time, test4_q2_time, test4_q3_time, test4_q4_time,
            test6_q1_score, test6_q2_score, test6_q3_score, test6_q4_score,
            test6_q1_time, test6_q2_time, test6_q3_time, test6_q4_time,
            video_link
        FROM child_assessment_features
        WHERE id = %s
    """, (session_id,))

    row = cur.fetchone()
    conn.close()

    return row
