// Common gitignore templates from GitHub's collection
// Source: https://github.com/github/gitignore
export interface GitignoreTemplate {
    name: string;
    filename: string;
}

export const githubTemplates: GitignoreTemplate[] = [
    // Popular languages & frameworks
    { name: "Node", filename: "Node.gitignore" },
    { name: "Python", filename: "Python.gitignore" },
    { name: "Go", filename: "Go.gitignore" },
    { name: "Rust", filename: "Rust.gitignore" },
    { name: "Java", filename: "Java.gitignore" },
    { name: "TypeScript", filename: "TypeScript.gitignore" },
    { name: "C++", filename: "C++.gitignore" },
    { name: "C", filename: "C.gitignore" },

    // Web frameworks
    { name: "React", filename: "React.gitignore" },
    { name: "Vue", filename: "Vue.gitignore" },
    { name: "Angular", filename: "Angular.gitignore" },
    { name: "Next.js", filename: "Nextjs.gitignore" },
    { name: "Nuxt.js", filename: "Nuxt.gitignore" },
    { name: "Svelte", filename: "Svelte.gitignore" },

    // Backend frameworks
    { name: "Django", filename: "Django.gitignore" },
    { name: "Flask", filename: "Flask.gitignore" },
    { name: "FastAPI", filename: "FastAPI.gitignore" },
    { name: "Spring Boot", filename: "SpringBoot.gitignore" },
    { name: "Laravel", filename: "Laravel.gitignore" },
    { name: "Ruby on Rails", filename: "Rails.gitignore" },
    { name: "NestJS", filename: "NestJS.gitignore" },
    { name: "Express", filename: "Express.gitignore" },

    // Mobile
    { name: "Android", filename: "Android.gitignore" },
    { name: "iOS / macOS", filename: "Swift.gitignore" },
    { name: "Flutter", filename: "Flutter.gitignore" },
    { name: "React Native", filename: "ReactNative.gitignore" },

    // Tools & IDEs
    { name: "Visual Studio Code", filename: "VisualStudioCode.gitignore" },
    { name: "IntelliJ", filename: "IntelliJ.gitignore" },
    { name: "JetBrains", filename: "JetBrains.gitignore" },
    { name: "Vim", filename: "Vim.gitignore" },
    { name: "Emacs", filename: "Emacs.gitignore" },
    { name: "Sublime Text", filename: "SublimeText.gitignore" },

    // Build tools & package managers
    { name: "Maven", filename: "Maven.gitignore" },
    { name: "Gradle", filename: "Gradle.gitignore" },
    { name: "SBT (Scala)", filename: "SBT.gitignore" },
    { name: "Composer (PHP)", filename: "Composer.gitignore" },
    { name: "Cargo (Rust)", filename: "Cargo.gitignore" },

    // Cloud & DevOps
    { name: "Terraform", filename: "Terraform.gitignore" },
    { name: "Docker", filename: "Docker.gitignore" },
    { name: "Kubernetes", filename: "Kubernetes.gitignore" },
    { name: "Ansible", filename: "Ansible.gitignore" },
    { name: "Chef", filename: "Chef.gitignore" },
    { name: "Puppet", filename: "Puppet.gitignore" },

    // Databases
    { name: "MongoDB", filename: "MongoDB.gitignore" },
    { name: "PostgreSQL", filename: "PostgreSQL.gitignore" },
    { name: "Redis", filename: "Redis.gitignore" },

    // Other
    { name: "Linux", filename: "Linux.gitignore" },
    { name: "Windows", filename: "Windows.gitignore" },
    { name: "macOS", filename: "macOS.gitignore" },
    { name: "Git", filename: "Git.gitignore" },
];

// Base URL for GitHub raw content
export const GITHUB_GITIGNORE_BASE_URL = "https://raw.githubusercontent.com/github/gitignore/main";
