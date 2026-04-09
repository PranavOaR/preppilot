import { NextRequest } from "next/server";
import { runAgainstTestCases } from "@/lib/judge/client";
import { LANGUAGE_IDS } from "@/lib/judge/languages";

/**
 * Comprehensive C++ auto-wrapper for LeetCode-style Solution classes.
 *
 * Handles all param/return types used in the 28 DSA problems:
 * - Primitives: int, long long, string, bool, double
 * - Arrays: vector<int>, vector<string>, vector<vector<int>>, vector<vector<char>>
 * - Linked list: ListNode* (single node), vector<ListNode*> (k-lists)
 * - Tree: TreeNode*
 *
 * Input/output formats (per test case data):
 *   vector<int>         → "[1,2,3]"
 *   vector<string>      → '["eat","tea","bat"]'
 *   vector<vector<int>> → "[[1,2],[3,4]]"
 *   vector<vector<char>>→ "[[1,1,0],[0,1,0]]"   (0/1 digits stored as chars '0'/'1')
 *   ListNode*           → "[1,2,3]"
 *   vector<ListNode*>   → "[[1,4,5],[1,3,4]]"
 *   TreeNode*           → "[4,2,7,null,null,1]"  (level-order, nulls included)
 *   int / long long     → one line with the number
 *   string              → one line (no surrounding quotes)
 *
 * Returns null if the signature cannot be parsed — caller falls back to error.
 */
function wrapCppSolution(code: string): string | null {
  if (!/class\s+Solution/.test(code)) return null;
  if (/\bint\s+main\b/.test(code)) return null;

  // Match the first public method signature
  const sigMatch = code.match(
    /public:\s*([\w<>*,\s]+?)\s+(\w+)\s*\(([^)]*)\)\s*\{/
  );
  if (!sigMatch) return null;

  const retType = sigMatch[1].trim();
  const method = sigMatch[2].trim();
  const paramsStr = sigMatch[3].trim();

  // Parse parameter list — strip trailing & (reference) but keep * (pointer)
  interface Param { type: string; name: string }
  const params: Param[] = [];
  if (paramsStr) {
    for (const raw of paramsStr.split(",")) {
      const t = raw.trim();
      const nm = t.match(/(\w+)\s*$/)?.[1];
      if (!nm) return null;
      const typ = t.slice(0, t.lastIndexOf(nm)).replace(/[&\s]+$/, "").trim();
      params.push({ type: typ, name: nm });
    }
  }

  const SUPPORTED_PARAMS = [
    "int", "long long", "string",
    "vector<int>", "vector<string>",
    "vector<vector<int>>", "vector<vector<char>>",
    "ListNode*", "TreeNode*", "vector<ListNode*>",
  ];
  const SUPPORTED_RET = [
    "int", "long long", "bool", "double", "float", "void", "string",
    "vector<int>", "vector<vector<int>>", "vector<vector<string>>",
    "ListNode*", "TreeNode*",
  ];

  for (const p of params) {
    if (!SUPPORTED_PARAMS.includes(p.type)) return null;
  }
  if (!SUPPORTED_RET.includes(retType)) return null;

  const uses = (t: string) => params.some((p) => p.type === t) || retType === t;
  const needsListNode = uses("ListNode*") || uses("vector<ListNode*>");
  const needsTreeNode = uses("TreeNode*");
  const needsIntArr   = uses("vector<int>") || uses("vector<vector<int>>") || uses("vector<ListNode*>") || uses("ListNode*");
  const needsStrArr   = uses("vector<string>") || uses("vector<vector<string>>");
  const needs2DInt    = uses("vector<vector<int>>");
  const needs2DChar   = uses("vector<vector<char>>");
  const needsListArr  = uses("vector<ListNode*>");

  // ─── Struct definitions (inserted before class Solution) ─────────────────
  let structs = "";
  if (needsListNode) {
    structs += `struct ListNode {
    int val; ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};\n`;
  }
  if (needsTreeNode) {
    structs += `struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *l, TreeNode *r) : val(x), left(l), right(r) {}
};\n`;
  }

  // Insert structs right before "class Solution"
  const codeWithStructs = structs
    ? code.replace(/class\s+Solution/, structs + "class Solution")
    : code;

  // ─── main() body ─────────────────────────────────────────────────────────
  let main = "\nint main() {\n";

  // Helper lambdas (only emit what's needed)
  if (needsIntArr) {
    main += `    auto _parseIntArr = [](const string& s) -> vector<int> {
        vector<int> v; if (s.size() < 2) return v;
        string inn = s.substr(1, s.size()-2); if (inn.empty()) return v;
        stringstream ss(inn); string tok;
        while (getline(ss,tok,',')) { tok.erase(remove_if(tok.begin(),tok.end(),::isspace),tok.end()); if (!tok.empty()) v.push_back(stoi(tok)); }
        return v;
    };\n`;
  }

  if (needs2DInt) {
    main += `    auto _parse2DInt = [&_parseIntArr](const string& s) -> vector<vector<int>> {
        vector<vector<int>> res; int dep=0,st=-1;
        for (int i=0;i<(int)s.size();i++) {
            if (s[i]=='['){dep++;if(dep==2)st=i;}
            else if(s[i]==']'){dep--;if(dep==1&&st!=-1){res.push_back(_parseIntArr(s.substr(st,i-st+1)));st=-1;}}
        } return res;
    };\n`;
  }

  if (needs2DChar) {
    main += `    auto _parse2DChar = [](const string& s) -> vector<vector<char>> {
        vector<vector<char>> res; int dep=0,st=-1;
        for (int i=0;i<(int)s.size();i++) {
            if (s[i]=='['){dep++;if(dep==2)st=i;}
            else if(s[i]==']'){dep--;if(dep==1&&st!=-1){
                string sub=s.substr(st+1,i-st-1); vector<char> row;
                stringstream ss(sub); string tok;
                while(getline(ss,tok,',')){tok.erase(remove_if(tok.begin(),tok.end(),::isspace),tok.end());if(!tok.empty())row.push_back(tok[0]);}
                res.push_back(row); st=-1;
            }}
        } return res;
    };\n`;
  }

  if (needsListNode) {
    main += `    auto _parseList = [&_parseIntArr](const string& s) -> ListNode* {
        auto v=_parseIntArr(s); if(v.empty())return nullptr;
        ListNode* h=new ListNode(v[0]),*c=h;
        for(int i=1;i<(int)v.size();i++){c->next=new ListNode(v[i]);c=c->next;}
        return h;
    };
    auto _printList = [](ListNode* h){
        cout<<"["; bool f=true;
        while(h){if(!f)cout<<",";cout<<h->val;f=false;h=h->next;}
        cout<<"]\\n";
    };\n`;
  }

  if (needsListArr) {
    main += `    auto _parseListArr = [&_parseList](const string& s) -> vector<ListNode*> {
        vector<ListNode*> res; int dep=0,st=-1;
        for(int i=0;i<(int)s.size();i++){
            if(s[i]=='['){dep++;if(dep==2)st=i;}
            else if(s[i]==']'){dep--;if(dep==1&&st!=-1){res.push_back(_parseList(s.substr(st,i-st+1)));st=-1;}}
        } return res;
    };\n`;
  }

  if (needsTreeNode) {
    main += `    auto _parseTree = [](const string& s) -> TreeNode* {
        if(s=="[]"||s.empty())return nullptr;
        string inn=s.substr(1,s.size()-2); vector<string> toks;
        stringstream ss(inn); string t;
        while(getline(ss,t,',')){t.erase(remove_if(t.begin(),t.end(),::isspace),t.end());toks.push_back(t);}
        if(toks.empty()||toks[0]=="null")return nullptr;
        TreeNode* root=new TreeNode(stoi(toks[0]));
        queue<TreeNode*> q; q.push(root); int i=1;
        while(!q.empty()&&i<(int)toks.size()){
            TreeNode* nd=q.front();q.pop();
            if(i<(int)toks.size()&&toks[i]!="null"){nd->left=new TreeNode(stoi(toks[i]));q.push(nd->left);}i++;
            if(i<(int)toks.size()&&toks[i]!="null"){nd->right=new TreeNode(stoi(toks[i]));q.push(nd->right);}i++;
        } return root;
    };
    auto _printTree = [](TreeNode* root){
        if(!root){cout<<"[]\\n";return;}
        vector<string> res; queue<TreeNode*> q; q.push(root);
        while(!q.empty()){TreeNode* nd=q.front();q.pop();
            if(nd){res.push_back(to_string(nd->val));q.push(nd->left);q.push(nd->right);}
            else res.push_back("null");}
        while(!res.empty()&&res.back()=="null")res.pop_back();
        cout<<"["; for(int i=0;i<(int)res.size();i++){if(i)cout<<",";cout<<res[i];} cout<<"]\\n";
    };\n`;
  }

  if (needsStrArr) {
    main += `    auto _parseStrArr = [](const string& s) -> vector<string> {
        vector<string> res; int i=1;
        while(i<(int)s.size()-1){
            while(i<(int)s.size()&&s[i]!='"')i++;
            if(i>=(int)s.size()-1)break; i++;
            string w; while(i<(int)s.size()&&s[i]!='"')w+=s[i++];
            res.push_back(w); i++;
        } return res;
    };\n`;
  }

  // ─── Read inputs ──────────────────────────────────────────────────────────
  for (const p of params) {
    const ln = `    string _${p.name}_s; getline(cin, _${p.name}_s);\n`;
    switch (p.type) {
      case "vector<int>":
        main += ln + `    auto _${p.name}=_parseIntArr(_${p.name}_s);\n`; break;
      case "int":
        main += ln + `    int _${p.name}=stoi(_${p.name}_s);\n`; break;
      case "long long":
        main += ln + `    long long _${p.name}=stoll(_${p.name}_s);\n`; break;
      case "string":
        main += `    string _${p.name}; getline(cin,_${p.name});\n`; break;
      case "vector<string>":
        main += ln + `    auto _${p.name}=_parseStrArr(_${p.name}_s);\n`; break;
      case "vector<vector<int>>":
        main += ln + `    auto _${p.name}=_parse2DInt(_${p.name}_s);\n`; break;
      case "vector<vector<char>>":
        main += ln + `    auto _${p.name}=_parse2DChar(_${p.name}_s);\n`; break;
      case "ListNode*":
        main += ln + `    auto _${p.name}=_parseList(_${p.name}_s);\n`; break;
      case "TreeNode*":
        main += ln + `    auto _${p.name}=_parseTree(_${p.name}_s);\n`; break;
      case "vector<ListNode*>":
        main += ln + `    auto _${p.name}=_parseListArr(_${p.name}_s);\n`; break;
    }
  }

  const args = params.map((p) => `_${p.name}`).join(", ");
  main += `    Solution sol;\n`;

  // ─── Call solution & print output ────────────────────────────────────────
  const print2DInt = (expr: string) =>
    `    auto _r=${expr};\n` +
    `    cout<<"[";\n` +
    `    for(int i=0;i<(int)_r.size();i++){if(i)cout<<",";cout<<"[";` +
    `for(int j=0;j<(int)_r[i].size();j++){if(j)cout<<",";cout<<_r[i][j];}cout<<"]";}\n` +
    `    cout<<"]\\n";\n`;

  switch (retType) {
    case "void": {
      main += `    sol.${method}(${args});\n`;
      // Print the first modified container param
      const v2d = params.find((p) => p.type === "vector<vector<int>>");
      const v1d = params.find((p) => p.type === "vector<int>");
      if (v2d) {
        main +=
          `    cout<<"[";\n` +
          `    for(int i=0;i<(int)_${v2d.name}.size();i++){if(i)cout<<",";cout<<"[";` +
          `for(int j=0;j<(int)_${v2d.name}[i].size();j++){if(j)cout<<",";cout<<_${v2d.name}[i][j];}cout<<"]";}\n` +
          `    cout<<"]\\n";\n`;
      } else if (v1d) {
        main +=
          `    cout<<"[";\n` +
          `    for(int i=0;i<(int)_${v1d.name}.size();i++){if(i)cout<<",";cout<<_${v1d.name}[i];}\n` +
          `    cout<<"]\\n";\n`;
      }
      break;
    }
    case "bool":
      main += `    cout<<(sol.${method}(${args})?"true":"false")<<"\\n";\n`; break;
    case "int": case "long long":
      main += `    cout<<sol.${method}(${args})<<"\\n";\n`; break;
    case "double": case "float":
      main += `    cout<<fixed<<setprecision(1)<<sol.${method}(${args})<<"\\n";\n`; break;
    case "string":
      main += `    cout<<sol.${method}(${args})<<"\\n";\n`; break;
    case "vector<int>": {
      main +=
        `    auto _res=sol.${method}(${args});\n` +
        `    cout<<"[";\n` +
        `    for(int i=0;i<(int)_res.size();i++){if(i)cout<<",";cout<<_res[i];}\n` +
        `    cout<<"]\\n";\n`;
      break;
    }
    case "vector<vector<int>>":
      main += print2DInt(`sol.${method}(${args})`); break;
    case "vector<vector<string>>": {
      main +=
        `    auto _res=sol.${method}(${args});\n` +
        `    cout<<"[";\n` +
        `    for(int i=0;i<(int)_res.size();i++){if(i)cout<<",";cout<<"[";` +
        `for(int j=0;j<(int)_res[i].size();j++){if(j)cout<<",";cout<<"\\"" <<_res[i][j]<<"\\"";}cout<<"]";}\n` +
        `    cout<<"]\\n";\n`;
      break;
    }
    case "ListNode*":
      main += `    _printList(sol.${method}(${args}));\n`; break;
    case "TreeNode*":
      main += `    _printTree(sol.${method}(${args}));\n`; break;
  }

  main += `    return 0;\n}`;

  return codeWithStructs + main;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, testCases, mode } = body as {
      code: string;
      language: string;
      testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
      mode: "run" | "submit";
    };

    if (!code || !language || !testCases) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      return Response.json({ error: "Unsupported language" }, { status: 400 });
    }

    // Prepend standard headers for C/C++ if missing
    let processedCode = code;
    if (language === "cpp" && !code.includes("#include")) {
      processedCode = `#include <bits/stdc++.h>\nusing namespace std;\n\n${code}`;
    } else if (language === "c" && !code.includes("#include")) {
      processedCode = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n\n${code}`;
    }

    const casesToRun =
      mode === "run"
        ? testCases.filter((tc) => !tc.isHidden)
        : testCases;

    // C++: auto-wrap LeetCode Solution class into a complete program
    if (language === "cpp" && !/\bint\s+main\b/.test(processedCode)) {
      const wrapped = wrapCppSolution(processedCode);
      if (wrapped) {
        processedCode = wrapped;
      } else {
        const hint =
          "Could not auto-wrap this C++ solution. Try switching to Python — it works automatically with all problem types.";
        const stubResults = casesToRun.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: "",
          passed: false,
          status: "Compile Error",
          time: null,
          memory: null,
          error: hint,
        }));
        return Response.json({
          results: stubResults,
          summary: { total: stubResults.length, passed: 0, allPassed: false, mode },
        });
      }
    }

    // C: require explicit main()
    if (language === "c" && !/\bint\s+main\b/.test(processedCode)) {
      const hint = "Your C code must have a `int main()` function that reads from stdin and prints to stdout.";
      const stubResults = casesToRun.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: "",
        passed: false,
        status: "Compile Error",
        time: null,
        memory: null,
        error: hint,
      }));
      return Response.json({
        results: stubResults,
        summary: { total: stubResults.length, passed: 0, allPassed: false, mode },
      });
    }

    const results = await runAgainstTestCases(
      processedCode,
      languageId,
      casesToRun.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }))
    );

    // Replace raw linker errors with friendly message
    const processedResults = results.map((r) => {
      if (r.error && r.error.includes("undefined reference to `main'")) {
        return {
          ...r,
          error:
            "Compile Error: Your C/C++ code must include an `int main()` function.",
        };
      }
      return r;
    });

    const totalPassed = processedResults.filter((r) => r.passed).length;
    const allPassed = totalPassed === results.length;

    return Response.json({
      results: processedResults,
      summary: {
        total: processedResults.length,
        passed: totalPassed,
        allPassed,
        mode,
      },
    });
  } catch (err) {
    console.error("Submission error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
