/**
 * Demo data — mirrors the fixtures baked into the design prototype so the UI
 * has something to render before the user generates anything.
 */
import { query } from "./pool.js";

export async function seedDemoData(): Promise<void> {
  const existing = await query<{ count: string }>(`SELECT count(*) FROM projects`);
  if (Number(existing[0]?.count ?? 0) > 0) return;

  await query(
    `INSERT INTO projects (id, title, subtitle, note, status, looks) VALUES
      ($1,'春装亚麻系列','aerial 春装','3 个模特 · 5 个场景','generating',$2::jsonb),
      ($3,'珠宝详情页 v4','光泽 · 极简','48 张已生成','ready',$4::jsonb),
      ($5,'海边度假草帽','海岛 · 黄昏','12 张已生成','ready',$6::jsonb)`,
    [
      "proj-linen",
      JSON.stringify(["cream", "sage", "bone"]),
      "proj-jewel",
      JSON.stringify(["studio", "ink", "midnight"]),
      "proj-hat",
      JSON.stringify(["desert", "coral", "sand"]),
    ],
  );

  await query(
    `INSERT INTO chat_messages (id, project_id, role, text, proposals) VALUES
      ($1,'proj-linen','user','上传了一件亚麻衬衫，想要春天的温柔感，模特要东方面孔',NULL),
      ($2,'proj-linen','ai',$3,$4::jsonb)`,
    [
      "seed-m1",
      "seed-m2",
      "好的，亚麻 + 东方面孔 + 春季温柔 — 我会从光线、姿态、构图三层来给你。先看三个方向。",
      JSON.stringify([
        { id: "p1", title: "苔园清晨", desc: "潮湿石阶 · 侧逆光 · 文学杂志感", looks: ["sage", "bone", "cream", "sage"] },
        { id: "p2", title: "亚麻日光", desc: "落地窗白纱 · 顶光 · 4:5 自然站姿", looks: ["cream", "bone", "rose", "cream"] },
        { id: "p3", title: "海边礼拜日", desc: "黄昏沙地 · 逆光剪影 · 走动序列", looks: ["desert", "coral", "sand", "desert"] },
      ]),
    ],
  );
}
