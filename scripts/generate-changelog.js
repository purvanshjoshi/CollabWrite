/**
 * CollabWrite - Conventional Commits Changelog Generator
 * Parses recent conventional git commits and prepends standard Keep-a-Changelog sections to CHANGELOG.md.
 */

const fs = require('fs');
const { execSync } = require('child_process');

function generateChangelog() {
  try {
    const rawCommits = execSync('git log --pretty=format:"%h|%s|%an|%ad" --date=short -n 50', { encoding: 'utf8' })
      .trim()
      .split('\n');

    const categories = {
      feat: [],
      fix: [],
      perf: [],
      refactor: [],
      docs: [],
      test: [],
      chore: []
    };

    for (const line of rawCommits) {
      const [hash, subject, author, date] = line.split('|');
      if (!subject) continue;

      const match = subject.match(/^([a-z]+)(\([a-z0-9-_.]+\))?:\s*(.+)$/i);
      if (match) {
        const type = match[1].toLowerCase();
        const scope = match[2] ? match[2].slice(1, -1) : '';
        const desc = match[3];

        if (categories[type]) {
          categories[type].push({ hash, scope, desc, author, date });
        } else {
          categories.chore.push({ hash, scope, desc, author, date });
        }
      }
    }

    const today = new Date().toISOString().split('T')[0];
    let newSection = `## [Unreleased] - ${today}\n\n`;

    if (categories.feat.length) {
      newSection += '### Added\n';
      categories.feat.forEach((c) => {
        newSection += `- ${c.scope ? `**${c.scope}**: ` : ''}${c.desc} ([${c.hash}])\n`;
      });
      newSection += '\n';
    }

    if (categories.fix.length) {
      newSection += '### Fixed\n';
      categories.fix.forEach((c) => {
        newSection += `- ${c.scope ? `**${c.scope}**: ` : ''}${c.desc} ([${c.hash}])\n`;
      });
      newSection += '\n';
    }

    if (categories.perf.length) {
      newSection += '### Performance\n';
      categories.perf.forEach((c) => {
        newSection += `- ${c.scope ? `**${c.scope}**: ` : ''}${c.desc} ([${c.hash}])\n`;
      });
      newSection += '\n';
    }

    if (categories.refactor.length) {
      newSection += '### Refactored\n';
      categories.refactor.forEach((c) => {
        newSection += `- ${c.scope ? `**${c.scope}**: ` : ''}${c.desc} ([${c.hash}])\n`;
      });
      newSection += '\n';
    }

    if (categories.docs.length) {
      newSection += '### Documentation\n';
      categories.docs.forEach((c) => {
        newSection += `- ${c.scope ? `**${c.scope}**: ` : ''}${c.desc} ([${c.hash}])\n`;
      });
      newSection += '\n';
    }

    let currentContent = '';
    if (fs.existsSync('CHANGELOG.md')) {
      currentContent = fs.readFileSync('CHANGELOG.md', 'utf8');
    }

    const header = '# Changelog\n\nAll notable changes to the **CollabWrite** project are documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n---\n\n';

    let body = currentContent.replace(/^# Changelog[\s\S]*?---\s*\n*/i, '');

    if (!body.includes(newSection.trim())) {
      const updated = header + newSection + body;
      fs.writeFileSync('CHANGELOG.md', updated, 'utf8');
      console.log('CHANGELOG.md updated successfully.');
    } else {
      console.log('CHANGELOG.md is already up to date.');
    }
  } catch (err) {
    console.error('Error generating changelog:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  generateChangelog();
}

module.exports = generateChangelog;
