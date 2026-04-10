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

/**
 * Auto-wrap a simple C function (no main) for Judge0.
 * Handles primitive return types: int, long, bool, double, float.
 * For array returns/params (int*, char*), falls back gracefully.
 */
function wrapCSolution(code: string): string | null {
  if (/\bint\s+main\b/.test(code)) return null;

  // Match first non-static function that looks like a LeetCode fn
  const sigMatch = code.match(
    /^(?:static\s+)?(\w[\w\s*]*?)\s+(\w+)\s*\(([^)]*)\)\s*\{/m
  );
  if (!sigMatch) return null;

  const retType = sigMatch[1].trim().replace(/\s+/g, " ");
  const method = sigMatch[2].trim();
  const paramsStr = sigMatch[3].trim();
  if (method === "main") return null;

  interface CP { type: string; name: string }
  const params: CP[] = [];
  if (paramsStr) {
    for (const raw of paramsStr.split(",")) {
      const t = raw.trim();
      const nm = t.match(/(\w+)\s*(?:\[\])*\s*$/)?.[1];
      if (!nm) continue;
      const typ = t.slice(0, t.lastIndexOf(nm)).replace(/\s+/g, " ").trim();
      params.push({ type: typ, name: nm });
    }
  }

  const readings: string[] = [];
  const args: string[] = [];
  let extraDecls = "";
  let arrayHelpers = "";
  let needsArrayHelper = false;

  for (const { type, name } of params) {
    const v = `_${name}`;
    if (type === "int") {
      readings.push(`int ${v}; scanf("%d", &${v});`);
      args.push(v);
    } else if (type === "long" || type === "long long") {
      readings.push(`long long ${v}; scanf("%lld", &${v});`);
      args.push(v);
    } else if (type === "double") {
      readings.push(`double ${v}; scanf("%lf", &${v});`);
      args.push(v);
    } else if (type === "bool" || type === "_Bool") {
      readings.push(`char _${name}_s[8]; scanf("%s", _${name}_s); int ${v}=(strcmp(_${name}_s,"true")==0);`);
      args.push(v);
    } else if (type === "int*" || type === "int *") {
      needsArrayHelper = true;
      extraDecls += `int ${v}_arr[1024]; int ${v}_sz=0;\n    `;
      readings.push(`_parseIntArr(${v}_arr, &${v}_sz);`);
      args.push(v + "_arr");
      // Find the size param (next int param after this)
      const sizeParam = params.find(p => (p.type === "int") && p.name !== name && !args.includes(`_${p.name}`));
      if (sizeParam) {
        extraDecls += `int _${sizeParam.name}=${v}_sz;\n    `;
        args.push(`_${sizeParam.name}`);
        params.splice(params.indexOf(sizeParam), 1); // skip it in outer loop
      }
    } else if (type === "char*" || type === "char *") {
      extraDecls += `char ${v}[1024];\n    `;
      readings.push(`scanf("%s", ${v});`);
      args.push(v);
    } else {
      return null; // unsupported type
    }
  }

  if (needsArrayHelper) {
    arrayHelpers = `
void _parseIntArr(int* arr, int* sz) {
    char line[4096]; fgets(line, sizeof(line), stdin);
    // skip leading [
    char* p=line; while(*p&&(*p=='['||*p==' '))p++;
    *sz=0;
    while(*p&&*p!=']'&&*p!='\\n'){
        arr[(*sz)++]=atoi(p);
        while(*p&&*p!=',' &&*p!=']')p++;
        if(*p==',')p++;
        while(*p==' ')p++;
    }
}
`;
  }

  let printCall: string;
  if (retType === "int") {
    printCall = `printf("%d\\n", ${method}(${args.join(", ")}));`;
  } else if (retType === "long" || retType === "long long") {
    printCall = `printf("%lld\\n", ${method}(${args.join(", ")}));`;
  } else if (retType === "bool" || retType === "_Bool") {
    printCall = `printf("%s\\n", ${method}(${args.join(", ")}) ? "true" : "false");`;
  } else if (retType === "double" || retType === "float") {
    printCall = `printf("%.6f\\n", (double)${method}(${args.join(", ")}));`;
  } else if (retType === "char*" || retType === "char *") {
    printCall = `printf("%s\\n", ${method}(${args.join(", ")}));`;
  } else if (retType === "void") {
    printCall = `${method}(${args.join(", ")});`;
  } else {
    return null;
  }

  return `${arrayHelpers}
${code}

int main() {
    ${extraDecls}${readings.join("\n    ")}
    ${printCall}
    return 0;
}`;
}

/**
 * Auto-wrap a LeetCode-style Python Solution class into a runnable script.
 * Adds boilerplate: __future__ annotations, ListNode/TreeNode definitions,
 * input parsing helpers, and a main block that reads stdin + prints output.
 */
function wrapPythonSolution(code: string): string | null {
  if (!/class\s+Solution/.test(code)) return null;
  if (/__name__\s*==/.test(code)) return null; // already has __main__ block

  // Extract first public non-dunder method signature
  const sigMatch = code.match(
    /def\s+([a-z]\w*)\s*\(\s*self(?:\s*,\s*([^)]*?))?\s*\)\s*(?:->\s*([^\n:]+?))?:/
  );
  if (!sigMatch) return null;

  const method = sigMatch[1];
  const paramsRaw = sigMatch[2] || "";
  const retAnnotation = (sigMatch[3] || "").trim();

  // Split param string respecting brackets
  const paramParts: string[] = [];
  let depth = 0, cur = "";
  for (const ch of paramsRaw + ",") {
    if (ch === "," && depth === 0) { if (cur.trim()) paramParts.push(cur.trim()); cur = ""; }
    else { if (ch === "[" || ch === "(") depth++; if (ch === "]" || ch === ")") depth--; cur += ch; }
  }

  const params: { name: string; hint: string }[] = [];
  for (const part of paramParts) {
    if (!part) continue;
    const colonIdx = part.indexOf(":");
    const name = (colonIdx >= 0 ? part.slice(0, colonIdx) : part).split("=")[0].trim();
    const hint = (colonIdx >= 0 ? part.slice(colonIdx + 1) : "").split("=")[0].trim()
      .toLowerCase().replace(/\s+/g, "");
    if (name) params.push({ name, hint });
  }

  const retHint = retAnnotation.toLowerCase().replace(/\s+/g, "");

  // Input reading per parameter
  const readLines: string[] = [];
  const callArgs: string[] = [];
  for (let i = 0; i < params.length; i++) {
    const { hint } = params[i];
    const v = `_a${i}`;
    callArgs.push(v);
    const clean = hint.replace(/optional\[/g, "").replace(/\]$/, "");
    if (clean.includes("listnode")) {
      readLines.push(`    ${v}=_ll(json.loads(lines[${i}]))`);
    } else if (clean.includes("treenode")) {
      readLines.push(`    ${v}=_tree(json.loads(lines[${i}]))`);
    } else if (clean === "int" || clean === "long") {
      readLines.push(`    ${v}=int(lines[${i}])`);
    } else if (clean === "float" || clean === "double") {
      readLines.push(`    ${v}=float(lines[${i}])`);
    } else if (clean === "bool") {
      readLines.push(`    ${v}=(lines[${i}].strip().lower()=='true')`);
    } else if (clean === "str" || clean === "string") {
      readLines.push(`    ${v}=lines[${i}].strip().strip('"')`);
    } else {
      // list[int], list[list[int]], etc. — JSON-parseable
      readLines.push(`    ${v}=json.loads(lines[${i}])`);
    }
  }

  // Output printing
  const cleanRet = retHint.replace(/optional\[/g, "").replace(/\]$/, "");
  let callLine: string;
  if (!cleanRet || cleanRet === "none") {
    // void: print first list/array param (modified in-place)
    const firstList = callArgs.find((_, i) => params[i].hint.includes("list") || params[i].hint.includes("[]")) || callArgs[0] || "_a0";
    callLine = `    sol.${method}(${callArgs.join(",")})\n    print(_fmt(${firstList}))`;
  } else if (cleanRet.includes("listnode")) {
    callLine = `    _r=sol.${method}(${callArgs.join(",")})\n    print(_fmt(_ll2a(_r)))`;
  } else if (cleanRet.includes("treenode")) {
    callLine = `    _r=sol.${method}(${callArgs.join(",")})\n    print(_fmt(_tree2a(_r)))`;
  } else if (cleanRet === "bool") {
    callLine = `    _r=sol.${method}(${callArgs.join(",")})\n    print('true' if _r else 'false')`;
  } else {
    callLine = `    _r=sol.${method}(${callArgs.join(",")})\n    print(_fmt(_r))`;
  }

  const header = `from __future__ import annotations
from typing import Optional,List,Dict,Tuple,Any
import sys,json

class ListNode:
    def __init__(self,val=0,next=None):self.val=val;self.next=next
class TreeNode:
    def __init__(self,val=0,left=None,right=None):self.val=val;self.left=left;self.right=right

def _ll(a):
    if not a:return None
    h=ListNode(a[0]);c=h
    for v in a[1:]:c.next=ListNode(v);c=c.next
    return h
def _ll2a(n):
    r=[]
    while n:r.append(n.val);n=n.next
    return r
def _tree(a):
    if not a or a[0] is None:return None
    root=TreeNode(a[0]);q=[root];i=1
    while q and i<len(a):
        nd=q.pop(0)
        if i<len(a) and a[i] is not None:nd.left=TreeNode(a[i]);q.append(nd.left)
        i+=1
        if i<len(a) and a[i] is not None:nd.right=TreeNode(a[i]);q.append(nd.right)
        i+=1
    return root
def _tree2a(root):
    if not root:return[]
    r=[];q=[root]
    while q:
        nd=q.pop(0)
        if nd:r.append(nd.val);q.append(nd.left);q.append(nd.right)
        else:r.append(None)
    while r and r[-1] is None:r.pop()
    return r
def _fmt(v):
    if v is None:return'null'
    if isinstance(v,bool):return'true'if v else'false'
    if isinstance(v,list):return'['+','.join(_fmt(x)for x in v)+']'
    if isinstance(v,str):return v
    return str(v)

`;

  const footer = `

if __name__=='__main__':
    sol=Solution()
    lines=[l.strip()for l in sys.stdin.read().strip().split('\\n')if l.strip()]
${readLines.join("\n")}
${callLine}
`;

  return header + code + footer;
}

/**
 * Auto-wrap a LeetCode-style Java Solution class into a runnable Main class.
 * Adds ListNode/TreeNode structs, parsing helpers, and a main() that reads
 * stdin and calls the solution method.
 */
function wrapJavaSolution(code: string): string | null {
  if (!/class\s+Solution/.test(code)) return null;
  if (/public\s+static\s+void\s+main/.test(code)) return null;
  if (/public\s+class\s+Main/.test(code)) return null;

  // Extract first public non-constructor method
  const sigMatch = code.match(
    /public\s+([\w\[\]<>,\s]+?)\s+(\w+)\s*\(([^)]*)\)\s*\{/
  );
  if (!sigMatch) return null;

  const retType = sigMatch[1].trim().replace(/\s+/g, " ");
  const method = sigMatch[2].trim();
  const paramsStr = sigMatch[3].trim();
  if (method === "Solution") return null;

  interface JP { type: string; name: string }
  const params: JP[] = [];
  if (paramsStr) {
    // Split params by commas NOT inside angle brackets (handles List<X,Y> generics)
    const splitParams: string[] = [];
    let depth = 0, cur = "";
    for (const ch of paramsStr + ",") {
      if (ch === "<") depth++;
      else if (ch === ">") depth--;
      if (ch === "," && depth === 0) {
        if (cur.trim()) splitParams.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    for (const raw of splitParams) {
      const t = raw.trim();
      const nm = t.match(/(\w+)\s*$/)?.[1];
      if (!nm) return null;
      const typ = t.slice(0, t.lastIndexOf(nm)).trim();
      params.push({ type: typ, name: nm });
    }
  }

  // Generate input reading per parameter
  const readings: string[] = [];
  const args: string[] = [];
  for (const { type, name } of params) {
    const v = `_${name}`;
    args.push(v);
    if (type === "int") {
      readings.push(`int ${v}=Integer.parseInt(sc.nextLine().trim());`);
    } else if (type === "long") {
      readings.push(`long ${v}=Long.parseLong(sc.nextLine().trim());`);
    } else if (type === "boolean") {
      readings.push(`boolean ${v}=sc.nextLine().trim().equals("true");`);
    } else if (type === "String") {
      readings.push(`String ${v}=sc.nextLine().trim().replaceAll("^\\\"|\\\"$","");`);
    } else if (type === "int[]") {
      readings.push(`int[] ${v}=_ia(sc.nextLine().trim());`);
    } else if (type === "int[][]") {
      readings.push(`int[][] ${v}=_ia2(sc.nextLine().trim());`);
    } else if (type === "char[][]") {
      readings.push(`char[][] ${v}=_ca2(sc.nextLine().trim());`);
    } else if (type === "String[]") {
      readings.push(`String[] ${v}=_sa(sc.nextLine().trim());`);
    } else if (type === "ListNode") {
      readings.push(`ListNode ${v}=_bl(_ia(sc.nextLine().trim()));`);
    } else if (type === "TreeNode") {
      readings.push(`TreeNode ${v}=_bt(sc.nextLine().trim());`);
    } else if (type === "List<List<Integer>>") {
      readings.push(`List<List<Integer>> ${v}=_ila2(sc.nextLine().trim());`);
    } else {
      return null; // unsupported type → fall back gracefully
    }
  }

  // Generate output printing
  let printExpr: string;
  if (retType === "int" || retType === "long") {
    printExpr = `System.out.println(sol.${method}(${args.join(",")}));`;
  } else if (retType === "boolean") {
    printExpr = `System.out.println(sol.${method}(${args.join(",")})?"true":"false");`;
  } else if (retType === "String") {
    printExpr = `System.out.println(sol.${method}(${args.join(",")}));`;
  } else if (retType === "int[]") {
    printExpr = `{int[]_r=sol.${method}(${args.join(",")});StringBuilder _s=new StringBuilder("[");for(int _i=0;_i<_r.length;_i++){if(_i>0)_s.append(",");_s.append(_r[_i]);}System.out.println(_s.append("]"));}`;
  } else if (retType === "int[][]") {
    printExpr = `{int[][]_r=sol.${method}(${args.join(",")});StringBuilder _s=new StringBuilder("[");for(int _i=0;_i<_r.length;_i++){_s.append("[");for(int _j=0;_j<_r[_i].length;_j++){if(_j>0)_s.append(",");_s.append(_r[_i][_j]);}if(_i<_r.length-1)_s.append(",]");else _s.append("]");}System.out.println(_s.append("]"));}`;
  } else if (retType === "List<Integer>" || retType === "List<String>") {
    printExpr = `{var _r=sol.${method}(${args.join(",")});System.out.println("["+String.join(",",_r.stream().map(String::valueOf).toArray(String[]::new))+"]");}`;
  } else if (retType === "List<List<Integer>>") {
    printExpr = `{var _r=sol.${method}(${args.join(",")});StringBuilder _s=new StringBuilder("[");for(int _i=0;_i<_r.size();_i++){_s.append("[");for(int _j=0;_j<_r.get(_i).size();_j++){if(_j>0)_s.append(",");_s.append(_r.get(_i).get(_j));}if(_i<_r.size()-1)_s.append(",]");else _s.append("]");}System.out.println(_s.append("]"));}`;
  } else if (retType === "ListNode") {
    printExpr = `{ListNode _r=sol.${method}(${args.join(",")});StringBuilder _s=new StringBuilder("[");boolean _f=true;while(_r!=null){if(!_f)_s.append(",");_s.append(_r.val);_f=false;_r=_r.next;}System.out.println(_s.append("]"));}`;
  } else if (retType === "TreeNode") {
    printExpr = `System.out.println(_ts(sol.${method}(${args.join(",")})));`;
  } else if (retType === "void") {
    // Print first array param (modified in-place)
    const arr = params.find(p => p.type.includes("[]"));
    if (arr) {
      const v = `_${arr.name}`;
      printExpr = `sol.${method}(${args.join(",")});{StringBuilder _s=new StringBuilder("[");for(int _i=0;_i<${v}.length;_i++){if(_i>0)_s.append(",");_s.append(${v}[_i]);}System.out.println(_s.append("]"));}`;
    } else {
      printExpr = `sol.${method}(${args.join(",")});`;
    }
  } else {
    return null;
  }

  return `import java.util.*;
import java.util.stream.*;

class ListNode{int val;ListNode next;ListNode(){}ListNode(int v){val=v;}ListNode(int v,ListNode n){val=v;next=n;}}
class TreeNode{int val;TreeNode left,right;TreeNode(){}TreeNode(int v){val=v;}TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}

${code}

public class Main{
static int[]_ia(String s){s=s.trim();if(s.equals("[]"))return new int[0];s=s.substring(1,s.length()-1);String[]p=s.split(",");int[]a=new int[p.length];for(int i=0;i<p.length;i++)a[i]=Integer.parseInt(p[i].trim());return a;}
static int[][]_ia2(String s){s=s.trim();if(s.equals("[]"))return new int[0][];List<int[]>r=new ArrayList<>();int d=0,st=-1;for(int i=0;i<s.length();i++){char c=s.charAt(i);if(c=='['){d++;if(d==2)st=i;}else if(c==']'){d--;if(d==1&&st!=-1){r.add(_ia(s.substring(st,i+1)));st=-1;}}}return r.toArray(new int[0][]);}
static char[][]_ca2(String s){int[][]t=_ia2(s);char[][]r=new char[t.length][];for(int i=0;i<t.length;i++){r[i]=new char[t[i].length];for(int j=0;j<t[i].length;j++)r[i][j]=(char)('0'+t[i][j]);}return r;}
static String[]_sa(String s){s=s.trim();if(s.equals("[]"))return new String[0];s=s.substring(1,s.length()-1);String[]p=s.split(",");for(int i=0;i<p.length;i++)p[i]=p[i].trim().replaceAll("^\\\"|\\\"$","");return p;}
static ListNode _bl(int[]a){if(a.length==0)return null;ListNode h=new ListNode(a[0]),c=h;for(int i=1;i<a.length;i++){c.next=new ListNode(a[i]);c=c.next;}return h;}
static TreeNode _bt(String s){s=s.trim();if(s.equals("[]"))return null;s=s.substring(1,s.length()-1);String[]p=s.split(",");if(p[0].trim().equals("null"))return null;TreeNode root=new TreeNode(Integer.parseInt(p[0].trim()));Queue<TreeNode>q=new LinkedList<>();q.add(root);int i=1;while(!q.isEmpty()&&i<p.length){TreeNode nd=q.poll();if(i<p.length&&!p[i].trim().equals("null")){nd.left=new TreeNode(Integer.parseInt(p[i].trim()));q.add(nd.left);}i++;if(i<p.length&&!p[i].trim().equals("null")){nd.right=new TreeNode(Integer.parseInt(p[i].trim()));q.add(nd.right);}i++;}return root;}
static String _ts(TreeNode root){if(root==null)return"[]";List<String>r=new ArrayList<>();Queue<TreeNode>q=new LinkedList<>();q.add(root);while(!q.isEmpty()){TreeNode nd=q.poll();if(nd!=null){r.add(String.valueOf(nd.val));q.add(nd.left);q.add(nd.right);}else r.add("null");}while(!r.isEmpty()&&r.get(r.size()-1).equals("null"))r.remove(r.size()-1);return"["+String.join(",",r)+"]";}
static List<List<Integer>>_ila2(String s){List<List<Integer>>res=new ArrayList<>();int d=0,st=-1;for(int i=0;i<s.length();i++){char c=s.charAt(i);if(c=='['){d++;if(d==2)st=i;}else if(c==']'){d--;if(d==1&&st!=-1){List<Integer>inner=new ArrayList<>();for(int x:_ia(s.substring(st,i+1)))inner.add(x);res.add(inner);st=-1;}}}return res;}
public static void main(String[]args){Scanner sc=new Scanner(System.in);Solution sol=new Solution();${readings.join("")}${printExpr}}
}`;
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

    let processedCode = code;

    // ── Python: add __future__ + wrap Solution class ──────────────────────
    if (language === "python") {
      if (!/class\s+Solution/.test(code)) {
        // Raw Python (user wrote their own main) — just add __future__ for safety
        if (!code.includes("from __future__")) {
          processedCode = "from __future__ import annotations\n" + code;
        }
      } else if (!/__name__\s*==/.test(code)) {
        // LeetCode-style Solution class without __main__ block — auto-wrap
        const wrapped = wrapPythonSolution(code);
        processedCode = wrapped ?? ("from __future__ import annotations\n" + code);
      }
    }

    // ── C/C++: add standard headers ───────────────────────────────────────
    if (language === "cpp" && !processedCode.includes("#include")) {
      processedCode = `#include <bits/stdc++.h>\nusing namespace std;\n\n${processedCode}`;
    } else if (language === "c" && !processedCode.includes("#include")) {
      processedCode = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n\n${processedCode}`;
    }

    const casesToRun =
      mode === "run"
        ? testCases.filter((tc) => !tc.isHidden)
        : testCases;

    // ── C++: auto-wrap LeetCode Solution class ────────────────────────────
    if (language === "cpp" && !/\bint\s+main\b/.test(processedCode)) {
      const wrapped = wrapCppSolution(processedCode);
      if (wrapped) {
        processedCode = wrapped;
      } else {
        const hint = "Could not auto-wrap this C++ solution. Try switching to Python.";
        const stubResults = casesToRun.map((tc) => ({
          input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: "",
          passed: false, status: "Compile Error", time: null, memory: null, error: hint,
        }));
        return Response.json({ results: stubResults, summary: { total: stubResults.length, passed: 0, allPassed: false, mode } });
      }
    }

    // ── Java: auto-wrap LeetCode Solution class ───────────────────────────
    if (language === "java" && !/public\s+static\s+void\s+main/.test(processedCode) && !/public\s+class\s+Main/.test(processedCode)) {
      const wrapped = wrapJavaSolution(processedCode);
      if (wrapped) {
        processedCode = wrapped;
      } else {
        const hint = "Could not auto-wrap this Java solution. Ensure your Solution class uses standard LeetCode-style method signatures.";
        const stubResults = casesToRun.map((tc) => ({
          input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: "",
          passed: false, status: "Compile Error", time: null, memory: null, error: hint,
        }));
        return Response.json({ results: stubResults, summary: { total: stubResults.length, passed: 0, allPassed: false, mode } });
      }
    }

    // ── C: auto-wrap simple LeetCode-style functions ──────────────────────
    if (language === "c" && !/\bint\s+main\b/.test(processedCode)) {
      const wrapped = wrapCSolution(processedCode);
      if (wrapped) {
        processedCode = wrapped;
      } else {
        const hint = "Could not auto-wrap this C solution. Add an int main() that reads input from stdin and prints output to stdout.";
        const stubResults = casesToRun.map((tc) => ({
          input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: "",
          passed: false, status: "Compile Error", time: null, memory: null, error: hint,
        }));
        return Response.json({ results: stubResults, summary: { total: stubResults.length, passed: 0, allPassed: false, mode } });
      }
    }

    const results = await runAgainstTestCases(
      processedCode,
      languageId,
      casesToRun.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }))
    );

    // Replace raw linker/runtime errors with friendly messages
    const processedResults = results.map((r) => {
      if (r.error && r.error.includes("undefined reference to `main'")) {
        return { ...r, error: "Compile Error: Your C/C++ code must include an `int main()` function." };
      }
      if (r.error && r.error.includes("Main method not found")) {
        return { ...r, error: "Compile Error: Your Java code must have a `public static void main(String[] args)` method, or use the standard LeetCode Solution class format." };
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
