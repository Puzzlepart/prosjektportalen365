export function task(name: string) {
    return (ctor: Function) => {
        ctor.prototype.name = name;
    };
}