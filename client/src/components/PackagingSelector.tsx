import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Packaging } from "@/types/schema";
import { useTranslation } from "@/i18n";

interface PackagingSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

interface ExtendedPackaging extends Packaging {
    type?: string;
}

export function PackagingSelector({ value, onChange }: PackagingSelectorProps) {
    const { data: packagings } = useQuery<Packaging[]>({
        queryKey: ["/api/packagings"],
    });

    const { data: builtinPackagings } = useQuery<ExtendedPackaging[]>({
        queryKey: ["/api/packagings/builtin"],
    });

    const { t } = useTranslation();

    const allPackagings = useMemo(() => {
        const custom = (packagings || []).map(p => ({ ...p, type: 'custom' }));
        const builtin = (builtinPackagings || []).map(p => {
            // Extract key from filename (e.g. "black.png" -> "black")
            const key = p.color.split('.')[0].toLowerCase();
            return {
                ...p,
                type: 'builtin',
                // Try to translate, fallback to original name
                name: t(`packagings.builtin.${key}`) === `packagings.builtin.${key}` ? p.name : t(`packagings.builtin.${key}`)
            };
        });
        return [...custom, ...builtin];
    }, [packagings, builtinPackagings, t]);

    const selectedPkg = allPackagings.find(p => p.id === value);

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[180px] bg-gray-900/50 border-gray-700 text-white h-10 text-sm">
                <SelectValue placeholder="Packaging">
                    {selectedPkg && (
                        <span className="flex items-center gap-2">
                            <img
                                src={`/assets/packages/${selectedPkg.type === 'builtin' ? 'builtin' : 'custom'}/${selectedPkg.color}`}
                                alt=""
                                className="w-5 h-5 object-contain"
                            />
                            <span>{selectedPkg.name}</span>
                        </span>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-white max-h-[300px]">
                <SelectItem value=" ">
                    <span className="text-gray-400 italic">None</span>
                </SelectItem>
                {allPackagings.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                        <span className="flex items-center gap-2">
                            <img
                                src={`/assets/packages/${pkg.type === 'builtin' ? 'builtin' : 'custom'}/${pkg.color}`}
                                alt=""
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <span>{pkg.name}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
