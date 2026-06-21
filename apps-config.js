// MPDG Hub PWA dropdown configuration
// Edit this file when you add or rearrange apps.

window.MPDG_APPS = [
  {
    group: "Treatment Planning",
    description: "Clinical planning tools for MPDG workflows.",
    apps: [
      {
        title: "Treatment Plan Dropdown App",
        subtitle: "Codes, teeth, phases, subtotals, and grand total.",
        status: "In progress",
        url: "#",
        tags: ["treatment plan", "CDT", "fees", "phases"]
      },
      {
        title: "Fee Schedule Lookup",
        subtitle: "Search procedure names, codes, and fees.",
        status: "Planned",
        url: "#",
        tags: ["fees", "codes", "search"]
      }
    ]
  },
  {
    group: "Patient Presentation",
    description: "Apps designed for clean chairside presentation.",
    apps: [
      {
        title: "Patient Treatment Summary",
        subtitle: "Simplified plan view for patient review.",
        status: "Planned",
        url: "#",
        tags: ["patient", "summary", "presentation"]
      }
    ]
  },
  {
    group: "Reference",
    description: "Clinical and administrative reference tools.",
    apps: [
      {
        title: "CDT Reference",
        subtitle: "Procedure code reference and notes.",
        status: "Planned",
        url: "#",
        tags: ["CDT", "reference"]
      },
      {
        title: "MPDG Admin Reference",
        subtitle: "Office notes, templates, and workflow references.",
        status: "Planned",
        url: "#",
        tags: ["admin", "workflow"]
      }
    ]
  }
];
