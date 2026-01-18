#!/usr/bin/env node
// feedback.js - JavaScript feedback loop worker
// Analyzes Zoe's JS code for issues and improvements

const fs = require('fs');
const path = require('path');

const ZOE_DIR = '/etc/zoe';
const JS_DIR = path.join(ZOE_DIR, 'js');
const LOG_FILE = '/var/log/atlas/zoe-feedback.log';

// Log with timestamp
function log(msg, level = 'info') {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line);
    if (level === 'error') {
        console.error(line.trim());
    }
}

// Simple JS linting rules
const lintRules = [
    {
        name: 'console-log',
        pattern: /console\.log\(/g,
        message: 'console.log found - consider using errors module',
        severity: 'warn'
    },
    {
        name: 'var-usage',
        pattern: /\bvar\s+/g,
        message: 'var used instead of let/const',
        severity: 'warn'
    },
    {
        name: 'eval-usage',
        pattern: /\beval\s*\(/g,
        message: 'eval() is dangerous',
        severity: 'error'
    },
    {
        name: 'innerHTML',
        pattern: /\.innerHTML\s*=/g,
        message: 'innerHTML can be XSS risk - use textContent',
        severity: 'warn'
    },
    {
        name: 'todo-comment',
        pattern: /\/\/\s*TODO/gi,
        message: 'TODO comment found',
        severity: 'info'
    },
    {
        name: 'fixme-comment',
        pattern: /\/\/\s*FIXME/gi,
        message: 'FIXME comment found',
        severity: 'warn'
    },
    {
        name: 'empty-catch',
        pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
        message: 'Empty catch block - errors should be handled',
        severity: 'error'
    },
    {
        name: 'magic-number',
        pattern: /[^.\d]\d{4,}[^.\d]/g,
        message: 'Magic number - consider using named constant',
        severity: 'info'
    }
];

// Analyze a single file
function analyzeFile(filePath) {
    const issues = [];

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        for (const rule of lintRules) {
            let match;
            const regex = new RegExp(rule.pattern.source, rule.pattern.flags);

            while ((match = regex.exec(content)) !== null) {
                // Find line number
                const upToMatch = content.substring(0, match.index);
                const lineNum = upToMatch.split('\n').length;

                issues.push({
                    file: path.basename(filePath),
                    line: lineNum,
                    rule: rule.name,
                    message: rule.message,
                    severity: rule.severity
                });
            }
        }

        // Check file metrics
        const metrics = {
            lines: lines.length,
            functions: (content.match(/function\s+\w+|=>\s*{|\w+\s*\([^)]*\)\s*{/g) || []).length,
            imports: (content.match(/^import/gm) || []).length,
            exports: (content.match(/^export/gm) || []).length
        };

        // Warn if file is too large
        if (metrics.lines > 300) {
            issues.push({
                file: path.basename(filePath),
                line: 0,
                rule: 'file-size',
                message: `File has ${metrics.lines} lines - consider splitting`,
                severity: 'info'
            });
        }

        return { issues, metrics };

    } catch (e) {
        log(`Error analyzing ${filePath}: ${e.message}`, 'error');
        return { issues: [], metrics: null, error: e.message };
    }
}

// Analyze all JS files
function analyzeAll() {
    const results = {
        timestamp: new Date().toISOString(),
        files: [],
        summary: {
            totalFiles: 0,
            totalIssues: 0,
            errors: 0,
            warnings: 0,
            info: 0
        }
    };

    try {
        const files = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'));

        for (const file of files) {
            const filePath = path.join(JS_DIR, file);
            const analysis = analyzeFile(filePath);

            results.files.push({
                name: file,
                ...analysis
            });

            results.summary.totalFiles++;
            results.summary.totalIssues += analysis.issues.length;

            for (const issue of analysis.issues) {
                if (issue.severity === 'error') results.summary.errors++;
                else if (issue.severity === 'warn') results.summary.warnings++;
                else results.summary.info++;
            }
        }

    } catch (e) {
        log(`Error reading JS directory: ${e.message}`, 'error');
    }

    return results;
}

// Generate report
function generateReport(results) {
    let report = `\n=== Zoe Feedback Report ===\n`;
    report += `Time: ${results.timestamp}\n`;
    report += `Files: ${results.summary.totalFiles}\n`;
    report += `Issues: ${results.summary.totalIssues} (${results.summary.errors} errors, ${results.summary.warnings} warnings)\n\n`;

    for (const file of results.files) {
        if (file.issues.length > 0) {
            report += `--- ${file.name} ---\n`;
            for (const issue of file.issues) {
                const prefix = issue.severity === 'error' ? 'ERROR' :
                              issue.severity === 'warn' ? 'WARN' : 'INFO';
                report += `  [${prefix}] Line ${issue.line}: ${issue.message}\n`;
            }
            report += '\n';
        }
    }

    return report;
}

// Main
function main() {
    log('Starting feedback analysis...');

    const results = analyzeAll();
    const report = generateReport(results);

    console.log(report);
    log(`Analysis complete: ${results.summary.totalIssues} issues found`);

    // Save results
    const resultsFile = path.join(ZOE_DIR, 'feedback-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

    // Exit with error code if there are errors
    process.exit(results.summary.errors > 0 ? 1 : 0);
}

main();
