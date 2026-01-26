import { Composition, Folder } from "remotion";
import { BlankTemplate } from "./templates/Blank";
import { PdfShowcase, PdfShowcaseSchema } from "./templates/PdfShowcase";
import { z } from "zod";

// Calculate video duration dynamically based on props
const calculatePdfShowcaseMetadata = ({ props }: { props: z.infer<typeof PdfShowcaseSchema> }) => {
  const { script, highlights } = props;

  let totalDuration = 0;

  if (script && script.length > 0) {
    // If custom script is provided, calculate total duration
    totalDuration = script.reduce((sum, item) => sum + (item.duration ?? 90), 0);
  } else if (highlights && highlights.length > 0) {
    // Default script from highlights: stack(60) + focus(120) + switch(120) * (n-1) + stack(60)
    totalDuration = 60 + 120 + (highlights.length - 1) * 120 + 60;
  } else {
    // Default duration
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
            subtitle: "Key Technical Insights",
            highlights: [1, 3, 9, 14, 20],
            pageTitles: {
              "1": "Abstract",
              "3": "Model Architecture",
              "9": "Post-training Process",
              "14": "Evaluation Results",
              "20": "Thinking Budget",
            },
            pageDescriptions: {
              "1": "Qwen3 is a new generation LLM from Alibaba Cloud, supporting Dense and MoE architectures with parameter scales ranging from 0.6B to 235B.",
              "3": "Based on Transformer architecture with GQA, RoPE optimizations for inference efficiency, supporting 32K context length.",
              "9": "Post-training follows a four-stage process: long context extension, SFT fine-tuning, reasoning enhancement, and general capability alignment.",
              "14": "Achieves leading results on multiple benchmarks including MMLU, GSM8K, HumanEval and other core evaluation metrics.",
              "20": "Introduces Thinking Budget mechanism, allowing users to control model's thinking depth for balancing quality and efficiency.",
            },
          }}
        />
      </Folder>
    </>
  );
};
