import { IconSearch } from "@tabler/icons-react";
import type { FC } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";

type Props = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export const MarketplaceSearch: FC<Props> = ({ value, placeholder, onChange }) => (
  <div className="relative mb-6">
    <InputGroup size="lg">
      <InputGroupAddon>
        <IconSearch className="size-5" />
      </InputGroupAddon>

      <InputGroupInput
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </InputGroup>
  </div>
);