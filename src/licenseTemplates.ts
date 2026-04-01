// License templates from GitHub's license-templates collection
// Source: https://github.com/licenses/license-templates/tree/master/templates
export interface LicenseTemplate {
    name: string;
    filename: string;
}

export const licenseTemplates: LicenseTemplate[] = [
    { name: "MIT", filename: "mit.txt" },
    { name: "Apache-2.0", filename: "apache.txt" },
    { name: "GPL-2.0", filename: "gpl2.txt" },
    { name: "GPL-3.0", filename: "gpl3.txt" },
    { name: "AGPL-3.0", filename: "agpl3.txt" },
    { name: "BSD-2-Clause", filename: "bsd2.txt" },
    { name: "BSD-3-Clause", filename: "bsd3.txt" },
    { name: "ISC", filename: "isc.txt" },
    { name: "MPL-2.0", filename: "mpl.txt" },
    { name: "LGPL-3.0", filename: "lgpl.txt" },
    { name: "EPL-2.0", filename: "epl.txt" },
    { name: "CDDL-1.0", filename: "cddl.txt" },
    { name: "CC0-1.0", filename: "cc0.txt" },
    { name: "CC-BY-4.0", filename: "cc_by.txt" },
    { name: "CC-BY-SA-4.0", filename: "cc_by_sa.txt" },
    { name: "CC-BY-ND-4.0", filename: "cc_by_nd.txt" },
    { name: "CC-BY-NC-4.0", filename: "cc_by_nc.txt" },
    { name: "CC-BY-NC-SA-4.0", filename: "cc_by_nc_sa.txt" },
    { name: "CC-BY-NC-ND-4.0", filename: "cc_by_nc_nd.txt" },
    { name: "Unlicense", filename: "unlicense.txt" },
    { name: "WTFPL", filename: "wtfpl.txt" },
    { name: "X11", filename: "x11.txt" },
    { name: "zlib", filename: "zlib.txt" },
];

// Base URL for GitHub raw content
export const LICENSE_TEMPLATES_BASE_URL = "https://raw.githubusercontent.com/licenses/license-templates/master/templates";
