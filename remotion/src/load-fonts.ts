import { loadFont } from "@remotion/google-fonts/DMSans";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

export { fontFamily };
