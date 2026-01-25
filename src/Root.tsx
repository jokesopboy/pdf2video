import { Composition, Folder } from "remotion";
import { BlankTemplate } from "./templates/Blank";
import { PdfShowcase, PdfShowcaseSchema } from "./templates/PdfShowcase";
import { z } from "zod";

// 根据 props 动态计算视频时长
const calculatePdfShowcaseMetadata = ({ props }: { props: z.infer<typeof PdfShowcaseSchema> }) => {
  const { script, highlights } = props;

  let totalDuration = 0;

  if (script && script.length > 0) {
    // 如果有自定义 script，计算总时长
    totalDuration = script.reduce((sum, item) => sum + (item.duration ?? 90), 0);
  } else if (highlights && highlights.length > 0) {
    // 根据 highlights 生成的默认 script：stack(60) + focus(120) + switch(120) * (n-1) + stack(60)
    totalDuration = 60 + 120 + (highlights.length - 1) * 120 + 60;
  } else {
    // 默认时长
    totalDuration = 720;
  }

  return {
    durationInFrames: totalDuration,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Templates">
        <Composition
          id="Blank"
          component={BlankTemplate}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="PdfShowcase"
          component={PdfShowcase}
          schema={PdfShowcaseSchema}
          calculateMetadata={calculatePdfShowcaseMetadata}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            src: "/sample.pdf",
            title: "Qwen3 Technical Report",
            subtitle: "核心技术解读",
            highlights: [1, 3, 9, 14, 20],
            pageTitles: {
              "1": "摘要",
              "3": "模型架构",
              "9": "后训练流程",
              "14": "评估结果",
              "20": "Thinking Budget",
            },
            pageDescriptions: {
              "1": "Qwen3 是阿里云推出的新一代大语言模型，支持 Dense 和 MoE 两种架构，参数规模从 0.6B 到 235B 不等。",
              "3": "采用 Transformer 架构，引入 GQA、RoPE 等技术优化推理效率，支持 32K 上下文长度。",
              "9": "后训练采用四阶段流程：长上下文扩展、SFT 微调、推理能力强化、通用能力对齐。",
              "14": "在多项基准测试中取得领先成绩，包括 MMLU、GSM8K、HumanEval 等核心评估指标。",
              "20": "引入 Thinking Budget 机制，允许用户控制模型的思考深度，平衡效果与效率。",
            },
          }}
        />
      </Folder>
    </>
  );
};
