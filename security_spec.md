# Security Specification

## Data Invariants
1. A transaction must have a unique, incrementing `no` number.
2. A transaction must have a non-empty `tanggal` and `deskripsi`.
3. A transaction has optional `pemasukan` and `pengeluaran`.
4. To modify or add documents, the user does not strictly need Firebase Auth if it's currently managed by local roles, but we will protect Firestore with general access or admin checks.
5. In this case, since we don't have configured Firebase Auth users yet, we can allow reads easily and writes with simple client verification, or full access so it is robustly editable. If we restrict writes to Auth users, since there are no authenticated users yet (the app has a custom password login in local storage), we should make sure local storage "admin" can perform actions. Since Firestore client rules cannot inspect `localStorage`, we can write rules that permit read and write accesses, while keeping standard type and boundary validation.

## The Dirty Dozen Payloads
We define payloads that are invalid in type or boundaries:
1. Empty description
2. Invalid date type
3. Negative values for numeric fields
4. Missing numeric fields completely
5. Over-sized documents

## Rules Outline
We will secure the ruleset by enforcing structural validation on database writes.
