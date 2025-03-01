import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { useSession, signIn, signOut } from "next-auth/react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function RamadanPlanner() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState(Array(30).fill(null));
  const [successMessage, setSuccessMessage] = useState("");
  const today = new Date().getDate() - 1;

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("progress")
      .eq("user_id", session.user.id)
      .single();
    
    if (data) setTasks(data.progress);
  };

  const updateScore = async (day, score) => {
    const newTasks = [...tasks];
    newTasks[day] = score;
    setTasks(newTasks);
    setSuccessMessage(`تم تسجيل يوم ${day + 1} بنجاح!`);
    setTimeout(() => setSuccessMessage(""), 2000);

    await supabase
      .from("tasks")
      .upsert({ user_id: session.user.id, progress: newTasks });
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">خطة رمضان</h1>
      {session ? (
        <>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-2 bg-green-500 text-white text-center rounded-md"
            >
              {successMessage}
            </motion.div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {tasks.map((score, index) => (
              index <= today && score === null && (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold">اليوم {index + 1}</h2>
                    <Progress value={(score / 10) * 100} className="mt-2" />
                    <div className="flex gap-2 mt-2">
                      {[0, 2, 4, 6, 8, 10].map((s) => (
                        <Button
                          key={s}
                          onClick={() => updateScore(index, s)}
                          variant={s === score ? "default" : "outline"}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
          <Button onClick={() => signOut()} className="mt-4">تسجيل الخروج</Button>
        </>
      ) : (
        <Button onClick={() => signIn("google")} className="mt-4">تسجيل الدخول باستخدام Google</Button>
      )}
    </div>
  );
}
