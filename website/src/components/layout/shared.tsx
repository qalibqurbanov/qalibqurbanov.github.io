import { Briefcase, Cpu, FolderGit2, House, Mail, PenLine, User } from "lucide-react";
import type { ComponentType } from "react";

import { GithubIcon, LinkedinIcon, MediumIcon, StackOverflowIcon, TelegramIcon } from "@/components/icons/BrandIcons";
import { useContent } from "@/i18n/context";

/** What the left menu card (Sidebar) and the phone's menu (Navbar) have in common, so the two are the same thing in two sizes. */
export type Icon = ComponentType<{ size?: number; className?: string }>;

/** Each page has a small line icon of its own, in front of its name. */
export const PAGE_ICONS: Record<string, Icon> = {
  "#home": House,
  "#about": User,
  "#experience": Briefcase,
  "#projects": FolderGit2,
  "#skills": Cpu,
  "#blog": PenLine,
  "#contact": Mail,
};

/** A small icon button of the footer row: the bug report, the source and the settings. */
export const TOOL = "inline-flex h-7 w-7 cursor-pointer items-center justify-center text-muted transition-colors duration-200 hover:text-accent";

/** The social links that are set, in order. */
export function useSocialLinks(): { label: string; href: string; Icon: Icon }[] {
  const { socials } = useContent();
  const links: { label: string; href: string; Icon: Icon }[] = [
    { label: "GitHub", href: socials.github, Icon: GithubIcon },
    { label: "LinkedIn", href: socials.linkedin, Icon: LinkedinIcon },
  ];
  if (socials.stackoverflow) links.push({ label: "Stack Overflow", href: socials.stackoverflow, Icon: StackOverflowIcon });
  if (socials.medium) links.push({ label: "Medium", href: socials.medium, Icon: MediumIcon });
  if (socials.telegram) links.push({ label: "Telegram", href: socials.telegram, Icon: TelegramIcon });
  return links;
}
