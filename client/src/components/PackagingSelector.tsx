import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Packaging } from "@/types/schema";

interface PackagingSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function PackagingSelector({ value, onChange }: PackagingSelectorProps) {
    const { data: packagings } = useQuery<Packaging[]>({
        queryKey: ["/api/packagings"],
    });

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white h-9 text-sm">
                <SelectValue placeholder="Packaging" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-white">
                <SelectItem value=" ">
                    <span className="text-gray-400 italic">None</span>
                </SelectItem>
                {packagings?.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                        <span className="flex items-center gap-2">
                            <span>{pkg.color}</span>
                            <span>{pkg.name}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
