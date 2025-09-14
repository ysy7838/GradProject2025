import React from "react";
import folder from "@/assets/images/folder.svg";
import { Image } from "lucide-react";

interface Props {
  imgs: string[];
  type: string;
}

const ImageGrid: React.FC<Props> = ({ imgs, type }) => {
  if (imgs.length === 0) {
    return type === "collection" ? (
      <div className="bg-gray-100 w-full h-[152px] py-4 flex justify-center rounded-lg flex-col items-center gap-5">
        <img src={folder} className="max-h-[90px]" />
        <p className="text-gray-700 text-sm font-normal px-2">
          아직 레퍼런스가 없어요.
        </p>
      </div>
    ) : (
      <div className="bg-gray-100 w-full h-[152px] py-4 flex justify-center rounded-lg flex-col items-center gap-5">
        <Image className="w-[80px] h-[80px] stroke-primary" />
      </div>
    );
  }

  if (imgs.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <img
          src={imgs[0]}
          className="w-full h-[152px] object-cover rounded-lg"
        />
        <div className="grid grid-rows-2 gap-2">
          {imgs.slice(1).map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-full h-[69.83px] object-cover rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid ${imgs.length > 1 ? "grid-cols-2" : ""} gap-2`}>
      {imgs.slice(0, 4).map((img, index) => (
        <img
          key={index}
          src={img}
          className={`w-full ${
            imgs.length === 1 || imgs.length === 2 ? "h-[152px]" : "h-[69.83px]"
          } object-cover rounded-lg`}
        />
      ))}
    </div>
  );
};

export default ImageGrid;
