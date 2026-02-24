interface TitleProps {
  title: string;
  subtitle?: string;
}

export default function Title({ title, subtitle }: TitleProps) {
  return (
    <div
      className="
        flex flex-col h-auto px-4 justify-start items-start  
        gap-y-1 shrink-0 self-stretch flex-wrap
      "
    >
      <h4
        className="
          text-[#121417] text-[32px] font-semibold 
          leading-[120%] 
        "
      >
        {title}
      </h4>
      {subtitle && (
        <p
          className="
             text-[14px] font-normal leading-[120%] text-[#737373]"
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
